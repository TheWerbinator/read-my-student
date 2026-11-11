import { useCallback, useEffect, useState } from "react";
import { siteFor } from "../../site";

const SITE = siteFor(import.meta.env.MODE);

// Shapes returned by src/app/api/extension/summary/route.ts on the site.
type Profile = Record<"name" | "title" | "department" | "institution" | "email" | "address", string>;
type Summary = {
  profile: Profile;
  requests: { requestId: string; studentName: string; courseContext: string | null; createdAt: string; writeUrl: string }[];
  letters: { letterId: string; studentName: string; finalizedAt: string }[];
};

const FIELDS: [keyof Profile, string][] = [
  ["name", "Name"],
  ["title", "Title"],
  ["department", "Department"],
  ["institution", "Institution"],
  ["email", "Email"],
  ["address", "Address"],
];

const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
const openTab = (url: string) => browser.tabs.create({ url });
const api = (path: string, token: string, method = "GET") =>
  fetch(`${SITE}${path}`, { method, headers: { Authorization: `Bearer ${token}` } });

export function App() {
  const [token, setToken] = useState<string | null | undefined>(undefined); // undefined while loading
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // The token arrives from the background script after the professor connects on the site.
  useEffect(() => {
    browser.storage.local.get("token").then((s) => setToken((s.token as string | undefined) ?? null));
    const onChange = (changes: Record<string, { newValue?: unknown }>, area: string) => {
      if (area === "local" && "token" in changes) setToken((changes.token.newValue as string | undefined) ?? null);
    };
    browser.storage.onChanged.addListener(onChange);
    return () => browser.storage.onChanged.removeListener(onChange);
  }, []);

  const load = useCallback(async () => {
    if (!token) return setData(null);
    setError(null);
    try {
      const res = await api("/api/extension/summary", token);
      // Expired or disconnected elsewhere: back to the connect screen.
      if (res.status === 401) return browser.storage.local.remove(["token", "expiresAt"]);
      if (!res.ok) throw new Error(String(res.status));
      setData(await res.json());
    } catch {
      setError("ReadMyStudent did not answer. Try again in a moment.");
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function copy(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied((c) => (c === label ? null : c)), 1500);
  }

  async function download(letterId: string) {
    if (!token) return;
    setError(null);
    const res = await api(`/api/extension/letters/${letterId}/pdf`, token).catch(() => null);
    const blob = res?.ok ? await res.blob() : null;
    if (!blob) return setError("The PDF could not be downloaded. Try again.");
    // A same-origin blob URL with the download attribute saves the file and keeps the panel open.
    const name = /filename="([^"]+)"/.exec(res!.headers.get("content-disposition") ?? "")?.[1];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name ?? "recommendation-letter.pdf";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async function disconnect() {
    if (token) await api("/api/extension/token", token, "DELETE").catch(() => null);
    await browser.storage.local.remove(["token", "expiresAt"]);
  }

  if (token === undefined) return null;

  if (!token) {
    return (
      <main>
        <h1>ReadMyStudent</h1>
        <p>Connect your professor account to see your requests and letters here.</p>
        <button className='primary' onClick={() => openTab(`${SITE}/extension/connect`)}>
          Connect
        </button>
        <p className='muted'>
          No account yet? Use the link in a request email, or{" "}
          <a href={`${SITE}/signup`} target='_blank' rel='noreferrer'>
            sign up as a professor
          </a>
          .
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>ReadMyStudent</h1>
      {error && (
        <p role='alert' className='error'>
          {error} <button onClick={load}>Retry</button>
        </p>
      )}
      {!data ? (
        !error && <p className='muted'>Loading...</p>
      ) : (
        <>
          <section aria-labelledby='profile'>
            <h2 id='profile'>Your details</h2>
            <p className='muted'>Click a field to copy it into a school form.</p>
            <ul className='fields'>
              {FIELDS.filter(([key]) => data.profile[key]).map(([key, label]) => (
                <li key={key}>
                  <button className='field' onClick={() => copy(label, data.profile[key])}>
                    <span className='label'>{copied === label ? "Copied" : label}</span>
                    <span>{data.profile[key]}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className='muted'>
              Missing something?{" "}
              <a href={`${SITE}/dashboard/settings`} target='_blank' rel='noreferrer'>
                Edit your profile
              </a>
              .
            </p>
          </section>

          <section aria-labelledby='requests'>
            <h2 id='requests'>Open requests ({data.requests.length})</h2>
            {data.requests.length === 0 ? (
              <p className='muted'>No requests waiting.</p>
            ) : (
              <ul className='list'>
                {data.requests.map((r) => (
                  <li key={r.requestId}>
                    <strong>{r.studentName}</strong>
                    <span className='muted'>
                      {r.courseContext ? `${r.courseContext}, ` : ""}asked {day(r.createdAt)}
                    </span>
                    <button onClick={() => openTab(r.writeUrl)}>Write letter</button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby='letters'>
            <h2 id='letters'>Sealed letters ({data.letters.length})</h2>
            {data.letters.length === 0 ? (
              <p className='muted'>No sealed letters yet.</p>
            ) : (
              <ul className='list'>
                {data.letters.map((l) => (
                  <li key={l.letterId}>
                    <strong>{l.studentName}</strong>
                    <span className='muted'>Sealed {day(l.finalizedAt)}</span>
                    <button onClick={() => download(l.letterId)}>Download PDF</button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <footer>
        <button onClick={() => openTab(`${SITE}/dashboard`)}>Open dashboard</button>
        <button onClick={load}>Refresh</button>
        <button onClick={disconnect}>Disconnect</button>
      </footer>
    </main>
  );
}
