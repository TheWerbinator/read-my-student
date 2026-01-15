import { NextRequest, NextResponse } from "next/server";

type UniversityResult = {
  id: string;          // OpenAlex ID (URL)
  name: string;        // display_name
  countryCode: string; // geo.country_code
  city?: string;
  region?: string;
  homepageUrl?: string;
  ror?: string | null;
};

type CacheEntry = { expires: number; payload: { results: UniversityResult[] } };
type Bucket = { tokens: number; last: number };

const g = globalThis as unknown as {
  __unicache?: Map<string, CacheEntry>;
  __uniBuckets?: Map<string, Bucket>;
};

const uniCache = g.__unicache ?? new Map<string, CacheEntry>();
g.__unicache = uniCache;

const buckets = g.__uniBuckets ?? new Map<string, Bucket>();
g.__uniBuckets = buckets;

// Adjustable values to compensate for expensive calls / abusive behavior
const MIN_QUERY_LEN = 3;
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes
const PER_PAGE = 20;

const BURST = 15;
const REFILL_PER_MS = 30 / (60 * 1000); // tokens per ms

function getClientKey(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim();
  return ip ?? "unknown";
}

function rateLimit(key: string) {
  const now = Date.now();
  const b: Bucket = buckets.get(key) ?? { tokens: BURST, last: now };

  const elapsed = now - b.last;
  b.tokens = Math.min(BURST, b.tokens + elapsed * REFILL_PER_MS);
  b.last = now;

  if(b.tokens < 1) {
    buckets.set(key, b);
    return false;
  }

  b.tokens -= 1;
  buckets.set(key, b);
  return true;
}

function cacheGet(key: string) {
  const hit = uniCache.get(key);
  if(!hit) return null;
  if(Date.now() > hit.expires) {
    uniCache.delete(key);
    return null;
  }
  return hit.payload;
}

function cacheSet(key: string, payload: { results: UniversityResult[] }) {
  uniCache.set(key, { expires: Date.now() + CACHE_TTL_MS, payload });
}

export async function GET(req: NextRequest) {

  const clientKey = getClientKey(req);
  if(!rateLimit(clientKey)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const url = new URL(req.url);
  const qRaw = (url.searchParams.get("q") ?? "").trim();
  const countryCode = (url.searchParams.get("countryCode") ?? "").trim().toLowerCase();

  if (!countryCode || countryCode.length !== 2) {
    return NextResponse.json({ error: "countryCode is required (ISO-2)." }, { status: 400 });
  }

  // Don’t hammer OpenAlex on tiny queries
  if (qRaw.length < MIN_QUERY_LEN) {
    return NextResponse.json({ results: [] as UniversityResult[] }, { status: 200 });
  }

  const q = qRaw.toLowerCase();
  const cacheKey = `${countryCode}:${q}`;

  const cached = cacheGet(cacheKey);
  if(cached) {
    return NextResponse.json(cached, { status: 200 });
  }

  // Put a real email in env for polite pool behavior
  const mailto = process.env.OPENALEX_MAILTO ?? "";
  const mailtoParam = mailto ? `&mailto=${encodeURIComponent(mailto)}` : "";

  // OpenAlex: search + filter by country_code
  const endpoint =
    `https://api.openalex.org/institutions` +
    `?search=${encodeURIComponent(qRaw)}` +
    `&filter=country_code:${encodeURIComponent(countryCode)}` +
    `&per-page=${PER_PAGE}` +
    // keep payload small
    `&select=id,display_name,geo,homepage_url,ror` +
    mailtoParam;

  const res = await fetch(endpoint, {
    headers: {
      // Helpful to include a UA; don’t put secrets here.
      "User-Agent": "ReadMyStudent/1.0 (university lookup)",
    },
    // You can tune caching later; start simple
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json(
      { error: "OpenAlex request failed", status: res.status, details: text.slice(0, 300) },
      { status: 502 }
    );
  }

  const data = await res.json();

  // eslint-disable-next-line
  const results: UniversityResult[] = (data?.results ?? []).map((it: any) => ({
    id: it.id,
    name: it.display_name,
    countryCode: it.geo?.country_code?.toUpperCase() ?? countryCode.toUpperCase(),
    city: it.geo?.city ?? undefined,
    region: it.geo?.region ?? undefined,
    homepageUrl: it.homepage_url ?? undefined,
    ror: it.ror ?? null,
  }));

  const payload = { results };
  cacheSet(cacheKey, payload);

  return NextResponse.json(payload, { status: 200 });
}
