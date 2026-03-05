/**
 * GET /api/cron/cleanup
 *
 * Daily retention sweep — called by Vercel Cron (see vercel.json at the
 * project root). Protected by a Bearer token matching the CRON_SECRET env var.
 *
 * Two sweeps:
 *
 *   1. **Letters** — deletes the PDF from the `letters` storage bucket and
 *      removes the DB row for any letter whose `expires_at` has passed
 *      (default: 1 year after finalization). Cascades to letter_signatures,
 *      delivery_links, and access_logs if FK ON DELETE CASCADE is set; if not,
 *      those rows are cleaned up explicitly before the letter row is deleted.
 *
 *   2. **Faculty assets** — removes logo/signature files from their respective
 *      Supabase Storage buckets (`faculty-logos` / `faculty-signatures`) and
 *      nulls the DB columns independently. Logo and signature retention clocks
 *      are tracked separately via `logo_uploaded_at` / `signature_uploaded_at`
 *      so updating one asset never resets the other's expiry.
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   CRON_SECRET  (optional but strongly recommended in production)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const adminSupabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

export async function GET(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) return unauthorized();
  }

  const now = new Date().toISOString();
  const results: Record<string, unknown> = { ran_at: now };

  // ── 1. Expire letters ──────────────────────────────────────────────────────────
  const { data: expiredLetters, error: expiredErr } = await adminSupabase
    .from("letters")
    .select("id, storage_path")
    .lt("expires_at", now)
    .not("expires_at", "is", null);

  if (expiredErr) {
    results.letters_error = expiredErr.message;
  } else {
    const count = expiredLetters?.length ?? 0;

    if (count > 0) {
      // Delete PDF files from storage
      const pdfPaths = (expiredLetters ?? [])
        .map((r) => r.storage_path as string | null)
        .filter((p): p is string => Boolean(p));

      if (pdfPaths.length > 0) {
        const { error: storageErr } = await adminSupabase.storage
          .from("letters")
          .remove(pdfPaths);
        if (storageErr) results.letters_storage_error = storageErr.message;
      }

      // Delete letter rows — cascades handle child tables if configured;
      // otherwise child rows with no CASCADE will block this and should be
      // addressed with a migration adding ON DELETE CASCADE.
      const ids = (expiredLetters ?? []).map((r) => r.id as string);
      const { count: deleted, error: deleteErr } = await adminSupabase
        .from("letters")
        .delete({ count: "exact" })
        .in("id", ids);

      if (deleteErr) results.letters_delete_error = deleteErr.message;
      results.letters_deleted = deleted ?? 0;
    } else {
      results.letters_deleted = 0;
    }
  }

  // ── 2. Expire faculty assets (logo and signature tracked independently) ────────
  //
  // Each asset lives in its own Supabase Storage bucket:
  //   • faculty-logos       (bucket name)
  //   • faculty-signatures  (bucket name)
  //
  // The DB columns logo_uploaded_at / signature_uploaded_at are set on upload
  // and reset to NOW when faculty click "Keep existing files". The cron checks
  // each independently so updating one asset doesn't reset the other's clock.

  const oneYearAgo = new Date(
    Date.now() - 365 * 24 * 60 * 60 * 1000,
  ).toISOString();

  // ── 2a. Logos ─────────────────────────────────────────────────────────────────
  const { data: expiredLogos, error: logoSelectErr } = await adminSupabase
    .from("faculty")
    .select("id, logo_storage_path")
    .lt("logo_uploaded_at", oneYearAgo)
    .not("logo_uploaded_at", "is", null);

  if (logoSelectErr) {
    results.logos_error = logoSelectErr.message;
  } else {
    const logoPaths = (expiredLogos ?? [])
      .map((r) => r.logo_storage_path as string | null)
      .filter((p): p is string => Boolean(p));

    if (logoPaths.length > 0) {
      const { error: logoStorageErr } = await adminSupabase.storage
        .from("faculty-logos")
        .remove(logoPaths);
      if (logoStorageErr) results.logos_storage_error = logoStorageErr.message;
    }

    if ((expiredLogos ?? []).length > 0) {
      const ids = (expiredLogos ?? []).map((r) => r.id as string);
      const { count: cleared, error: clearErr } = await adminSupabase
        .from("faculty")
        .update({
          logo_storage_path: null,
          logo_uploaded_at: null,
          updated_at: now,
        })
        .in("id", ids);
      if (clearErr) results.logos_clear_error = clearErr.message;
      results.logos_cleared = cleared ?? ids.length;
    } else {
      results.logos_cleared = 0;
    }
  }

  // ── 2b. Signatures ────────────────────────────────────────────────────────────
  const { data: expiredSigs, error: sigSelectErr } = await adminSupabase
    .from("faculty")
    .select("id, signature_storage_path")
    .lt("signature_uploaded_at", oneYearAgo)
    .not("signature_uploaded_at", "is", null);

  if (sigSelectErr) {
    results.signatures_error = sigSelectErr.message;
  } else {
    const sigPaths = (expiredSigs ?? [])
      .map((r) => r.signature_storage_path as string | null)
      .filter((p): p is string => Boolean(p));

    if (sigPaths.length > 0) {
      const { error: sigStorageErr } = await adminSupabase.storage
        .from("faculty-signatures")
        .remove(sigPaths);
      if (sigStorageErr)
        results.signatures_storage_error = sigStorageErr.message;
    }

    if ((expiredSigs ?? []).length > 0) {
      const ids = (expiredSigs ?? []).map((r) => r.id as string);
      const { count: cleared, error: clearErr } = await adminSupabase
        .from("faculty")
        .update({
          signature_storage_path: null,
          signature_uploaded_at: null,
          updated_at: now,
        })
        .in("id", ids);
      if (clearErr) results.signatures_clear_error = clearErr.message;
      results.signatures_cleared = cleared ?? ids.length;
    } else {
      results.signatures_cleared = 0;
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
