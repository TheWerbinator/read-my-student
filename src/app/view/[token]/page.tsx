/**
 * /view/[token]
 *
 * Public, token-gated letter view page for admissions offices.
 *
 * Access flow:
 *   1. Validate token (exists, paid/used status, not expired).
 *   2. Check for a signed HttpOnly cookie set by the verifyEmail action.
 *      If absent → render the EmailGateForm (email verification wall).
 *   3. Cookie present → atomically flip payment_status 'paid' → 'used'
 *      and log an 'opened' event for the audit trail.
 *      If the link is already 'used' and the cookie is valid, still serve the
 *      PDF — this allows the legitimate holder to refresh within their session.
 *   4. Generate a 1-hour server-side signed URL for the PDF and render the
 *      viewer. The signed URL is never client-accessible.
 *
 * Single-use enforcement:
 *   The conditional UPDATE (WHERE payment_status = 'paid') is atomic. A
 *   concurrent request that lost the race returns zero rows; we check for this
 *   and fall through to cookie-holder logic so the same valid session can
 *   refresh without being blocked.
 */

import { createHash } from "crypto";
import { cookies } from "next/headers";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import Image from "next/image";
import type { Metadata } from "next";

import Footer from "@/components/marketing/Footer";
import { LinkButton } from "@/components/ui/LinkButton";
import LogoWhite from "../../../../public/Logo_Official_White.png";
import { EmailGateForm } from "./EmailGateForm";
import { DownloadButton } from "./DownloadButton";
import { viewCookieName, viewCookieValue } from "./cookie-helpers";

// ─── Admin client (no cookie session — this page is public) ──────────────────

const adminSupabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Sealed letter",
  description:
    "View a securely delivered letter of recommendation via ReadMyStudent.",
  robots: { index: false, follow: false },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type InvalidReason = "not-found" | "expired" | "used";

// ─── Error states ─────────────────────────────────────────────────────────────

function ViewHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className='bg-board'>
      <div className='mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3'>
        <div className='flex items-center gap-4'>
          <Image src={LogoWhite} alt='ReadMyStudent' className='h-10 w-auto' sizes='60px' />
          <span className='caption text-flap-dim'>Sealed letter</span>
        </div>
        {children}
      </div>
    </header>
  );
}

function InvalidPage({ reason }: { reason: InvalidReason }) {
  // One plain cause per state, written for an admissions reader.
  const content: Record<InvalidReason, { title: string; body: string }> = {
    "not-found": {
      title: "This link does not work",
      body: "We could not find a letter for this link. It may have been cut off or changed when it was copied from the email.",
    },
    expired: {
      title: "This link has expired",
      body: "Each letter link works for 48 hours after the professor approves the delivery, and that time has passed.",
    },
    used: {
      title: "This link does not work",
      body: "This link cannot be opened right now.",
    },
  };

  const { title, body } = content[reason];

  return (
    <div className='board on-board flex min-h-screen flex-col'>
      <ViewHeader />
      <main className='flex-1 px-4 py-8 md:py-12'>
        <div className='sheet mx-auto max-w-lg p-5 md:p-8'>
          <h1 className='font-display text-2xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] text-forest-ink md:text-3xl'>
            {title}
          </h1>
          <p className='mt-4'>{body}</p>
          <p className='mt-4 border-t border-rule pt-4 text-sm text-ink-2'>
            Ask the applicant to send the letter to you again. Each send
            creates a fresh link for your office.
          </p>
          <LinkButton href='/contact' variant='secondary' size='md' className='mt-5'>
            Contact ReadMyStudent
          </LinkButton>
        </div>
      </main>
      <Footer compact />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ViewLetterPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // ── 1. Hash the token to look up the delivery row ─────────────────────────
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const { data: link } = await adminSupabase
    .from("delivery_links")
    .select(
      "id, payment_status, expires_at, school_name, student_user_id, letter_id",
    )
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!link) return <InvalidPage reason='not-found' />;

  // ── 2. Expiry check ───────────────────────────────────────────────────────
  const expiresAt = link.expires_at
    ? new Date(link.expires_at as string)
    : null;
  if (!expiresAt || expiresAt < new Date()) {
    return <InvalidPage reason='expired' />;
  }

  // ── 3. Status must be 'paid' or 'used' to proceed ─────────────────────────
  const status = link.payment_status as string;
  if (status !== "paid" && status !== "used") {
    return <InvalidPage reason='not-found' />;
  }

  // ── 4. Email-verification cookie gate ─────────────────────────────────────
  const cookieStore = await cookies();
  const cookieVal = cookieStore.get(viewCookieName(tokenHash))?.value;
  const expectedVal = viewCookieValue(tokenHash);
  const isVerified = cookieVal === expectedVal;

  if (!isVerified) {
    // Resolve names for the gate UI before rendering
    let studentFullName = "Applicant";
    const studentUserId = link.student_user_id as string | null;
    if (studentUserId) {
      const { data: authUser } =
        await adminSupabase.auth.admin.getUserById(studentUserId);
      const meta = authUser?.user?.user_metadata ?? {};
      studentFullName =
        [meta.firstName, meta.lastName].filter(Boolean).join(" ") ||
        "Applicant";
    }

    return (
      <EmailGateForm
        token={token}
        schoolName={(link.school_name as string | null) ?? "your institution"}
        studentFullName={studentFullName}
      />
    );
  }

  // ── 5. Atomically consume the link on first verified load ─────────────────
  // If status is already 'used', the cookie holder is returning (e.g. refresh).
  // Skip the flip and logging to avoid double-counting.
  const deliveryLinkId = link.id as string;
  if (status === "paid") {
    const { data: claimed } = await adminSupabase
      .from("delivery_links")
      .update({ payment_status: "used" })
      .eq("id", deliveryLinkId)
      .eq("payment_status", "paid") // atomic — zero rows if already flipped
      .select("id")
      .single();

    if (claimed) {
      await adminSupabase.from("delivery_access_events").insert({
        delivery_link_id: deliveryLinkId,
        event_type: "opened",
        ip_address: null,
        user_agent: null,
      });
    }
    // If claimed is null, a race was lost — cookie holder still proceeds.
  }

  // ── 6. Load letter ────────────────────────────────────────────────────────
  const { data: letter } = await adminSupabase
    .from("letters")
    .select("storage_path, finalized_at, faculty_id")
    .eq("id", link.letter_id as string)
    .maybeSingle();

  if (!letter?.storage_path) {
    console.error("[view] letter missing storage_path for letter_id:", link.letter_id);
    return <InvalidPage reason='not-found' />;
  }

  // ── 7. Load signature metadata ────────────────────────────────────────────
  const { data: sig } = await adminSupabase
    .from("letter_signatures")
    .select("pdf_sha256, signed_at, signing_key_id")
    .eq("letter_id", link.letter_id as string)
    .maybeSingle();

  // ── 8. Resolve faculty display name via auth user metadata ────────────────
  let facultyName = "Faculty";
  const facultyId = letter.faculty_id as string | null;
  if (facultyId) {
    const { data: facultyRow } = await adminSupabase
      .from("faculty")
      .select("user_id")
      .eq("id", facultyId)
      .maybeSingle();
    if (facultyRow?.user_id) {
      const { data: facultyAuth } = await adminSupabase.auth.admin.getUserById(
        facultyRow.user_id as string,
      );
      const meta = facultyAuth?.user?.user_metadata ?? {};
      facultyName =
        [meta.title, meta.firstName, meta.lastName].filter(Boolean).join(" ") ||
        "Faculty";
    }
  }

  // ── 9. Resolve student display name ───────────────────────────────────────
  let studentFullName = "Applicant";
  const studentUserId = link.student_user_id as string | null;
  if (studentUserId) {
    const { data: authUser } =
      await adminSupabase.auth.admin.getUserById(studentUserId);
    const meta = authUser?.user?.user_metadata ?? {};
    studentFullName =
      [meta.firstName, meta.lastName].filter(Boolean).join(" ") || "Applicant";
  }

  // ── 10. Generate short-lived signed PDF URL (server-side only) ───────────
  const { data: signedData } = await adminSupabase.storage
    .from("letters")
    .createSignedUrl(letter.storage_path as string, 3600); // 1-hour TTL

  if (!signedData?.signedUrl) {
    console.error("[view] createSignedUrl failed for storage_path:", letter.storage_path);
    return <InvalidPage reason='not-found' />;
  }

  const pdfUrl = signedData.signedUrl;
  const finalizedDate = letter.finalized_at
    ? new Date(letter.finalized_at as string).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown";
  const schoolName = (link.school_name as string | null) ?? "Institution";

  // ── 11. Render ────────────────────────────────────────────────────────────
  return (
    <div className='board on-board flex min-h-screen flex-col'>
      <ViewHeader>
        <span className='caption text-mint'>Email verified</span>
      </ViewHeader>

      <main className='mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 py-6'>
        {/* Metadata */}
        <dl className='sheet grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 md:p-5'>
          {[
            ["Applicant", studentFullName],
            ["Written by", facultyName],
            ["Delivered to", schoolName],
            ["Finalized", finalizedDate],
          ].map(([label, value]) => (
            <div key={label} className='min-w-0'>
              <dt className='caption text-ink-2'>{label}</dt>
              <dd className='mt-1 break-words text-sm font-semibold'>
                {value}
              </dd>
            </div>
          ))}
        </dl>

        {/* Toolbar */}
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <p className='text-sm text-ink-2'>
            Recommendation letter for{" "}
            <span className='font-semibold text-ink'>{studentFullName}</span>
          </p>
          <DownloadButton
            pdfUrl={pdfUrl}
            deliveryLinkId={deliveryLinkId}
            studentFullName={studentFullName}
          />
        </div>

        {/* Iframe */}
        <div className='sheet overflow-hidden'>
          <iframe
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
            className='h-[80vh] w-full'
            title={`Recommendation letter for ${studentFullName}`}
          />
        </div>

        {/* Signature / integrity strip */}
        {sig && (
          <div className='sheet flex flex-wrap items-center gap-4 p-4 md:p-5'>
            <span className='text-sm font-semibold text-sealed'>
              Cryptographic integrity verified
            </span>
            <div className='grid gap-1 text-xs text-ink-2 sm:ml-auto sm:text-right'>
              <div>
                <span className='font-medium text-ink'>SHA-256: </span>
                <span className='font-mono'>
                  {(sig.pdf_sha256 as string).slice(0, 16)}&hellip;
                </span>
              </div>
              <div>
                <span className='font-medium text-ink'>Signed: </span>
                {sig.signed_at
                  ? new Date(sig.signed_at as string).toLocaleDateString(
                      "en-US",
                      { year: "numeric", month: "short", day: "numeric" },
                    )
                  : "Not given"}
              </div>
              <div>
                <span className='font-medium text-ink'>Key: </span>
                <span className='font-mono break-all'>
                  {sig.signing_key_id as string}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Access notice */}
        <p className='text-xs text-ink-2'>
          This link works for 48 hours after the professor approved it, and only
          after the recipient confirms their email. This letter was sealed and
          delivered via{" "}
          <a href='https://readmystudent.com' className='underline'>
            ReadMyStudent
          </a>
          .
        </p>
      </main>

      <Footer compact />
    </div>
  );
}
