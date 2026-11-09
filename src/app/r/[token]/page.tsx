/**
 * /r/[token]: a professor answers one letter request from the emailed link,
 * with no account. Access rules live in authorizeRequestAccess.
 */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import { FlapText } from "@/components/board/FlapText";
import { lampOnBoard } from "@/components/board/status";
import Footer from "@/components/marketing/Footer";
import { LinkButton } from "@/components/ui/LinkButton";
import { authorizeRequestAccess } from "@/lib/request-access";
import { EXPIRE_AFTER_DAYS } from "@/lib/request-sweep";
import LogoWhite from "../../../../public/Logo_Official_White.png";
import { RequestLinkActions } from "./RequestLinkActions";
import { MarkOpened } from "./MarkOpened";

export const metadata: Metadata = {
  title: "Letter request",
  robots: { index: false, follow: false },
  // The token is in the URL, so never send it to other sites.
  referrer: "no-referrer",
};

const admin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

/** Whole days before the day-7 close, counted from created_at (same rule as the sweep). */
function daysLeft(createdAt: string): number {
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
  return Math.ceil(EXPIRE_AFTER_DAYS - ageDays);
}

function Shell({
  title,
  above,
  children,
}: {
  title: string;
  above?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className='board on-board flex min-h-screen flex-col'>
      <header className='bg-board'>
        <div className='mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3'>
          <Image src={LogoWhite} alt='ReadMyStudent' className='h-10 w-auto' />
          <span className='caption text-flap-dim'>Letter request</span>
        </div>
      </header>
      <main className='flex-1 px-4 py-6 md:py-12'>
        <div className='mx-auto max-w-2xl space-y-5'>
          {above}
          <div className='sheet p-5 md:p-8'>
            <h1 className='font-display text-2xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] text-forest-ink md:text-3xl'>
              {title}
            </h1>
            <div className='mt-5 space-y-4 text-ink [&_p]:max-w-[65ch]'>
              {children}
            </div>
          </div>
        </div>
      </main>
      <Footer compact />
    </div>
  );
}

const dtClass = "caption text-ink-2";

export default async function RequestLinkPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const access = await authorizeRequestAccess(null, token);

  if (!access) {
    return (
      <Shell title='This link does not work'>
        <p>
          The link may be incomplete. Open it again from the email. If it still
          does not work, ask the student to send a new request.
        </p>
      </Shell>
    );
  }

  const [{ data: request }, { data: student }, { data: letter }] =
    await Promise.all([
      admin
        .from("letter_requests")
        .select("course_context, student_note, created_at")
        .eq("id", access.requestId)
        .single(),
      admin
        .from("students")
        .select("user_id, university, program")
        .eq("id", access.studentId)
        .single(),
      admin
        .from("letters")
        .select("is_draft")
        .eq("request_id", access.requestId)
        .maybeSingle(),
    ]);

  const studentAuth = student?.user_id
    ? (await admin.auth.admin.getUserById(student.user_id as string)).data.user
    : null;
  const meta = studentAuth?.user_metadata ?? {};
  const studentName =
    [meta.firstName, meta.lastName].filter(Boolean).join(" ") || "The student";
  const studentEmail = studentAuth?.email ?? null;

  if (access.status === "rejected") {
    return (
      <Shell title='You declined this request'>
        <p>{studentName} received an email that you declined.</p>
      </Shell>
    );
  }

  if (access.status === "expired") {
    return (
      <Shell title='This request closed'>
        <p>
          It closed after 7 days without an answer. {studentName} can send a new
          request if you still want to write the letter.
        </p>
      </Shell>
    );
  }

  const signupHref = `/signup?role=FACULTY${
    access.professorEmail
      ? `&email=${encodeURIComponent(access.professorEmail)}`
      : ""
  }`;

  if (letter && !letter.is_draft) {
    return (
      <Shell title='Your letter is finalized'>
        <p>
          The letter for {studentName} is sealed and signed. {studentName} can
          now send it to their schools. You do not need to do anything else.
        </p>
        <div className='border-t border-rule pt-5'>
          <h2 className='font-display text-xl font-bold uppercase tracking-[0.04em] text-forest-ink'>
            Writing more letters?
          </h2>
          <p className='mt-2 text-sm text-ink-2'>
            A free account keeps all your requests in one place and fills in
            your details, letterhead, and signature next time.
          </p>
          <LinkButton href={signupHref} variant='gold' className='mt-4'>
            Create a free account
          </LinkButton>
        </div>
      </Shell>
    );
  }

  const program = student?.program as string | null;
  const university = student?.university as string | null;

  const createdAt = request?.created_at as string | undefined;
  const left = createdAt && !access.respondedAt ? daysLeft(createdAt) : null;
  const requestedOn = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      })
    : null;
  const where = [program, university].filter(Boolean).join(", ");

  const departure = (
    <section aria-label='This request' className='board-frame'>
      <div className='flap-row grid grid-cols-[1fr_auto] items-start gap-x-4 gap-y-2 px-3 py-3 uppercase'>
        <span className='caption text-flap-dim'>
          {requestedOn ? `Requested ${requestedOn}` : "Requested"}
        </span>
        <FlapText
          text={access.respondedAt ? "Draft saved" : "Waits on you"}
          cascadeOnMount
          delay={300}
          className={`text-base ${access.respondedAt ? lampOnBoard.moving : lampOnBoard.waiting}`}
        />
        <p className='col-span-2 break-words font-display text-xl font-bold leading-tight tracking-[0.06em] text-flap-ink md:text-2xl'>
          {studentName}
        </p>
        {(where || left !== null) && (
          <p className='col-span-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm text-flap-dim'>
            <span className='break-words'>{where}</span>
            {left !== null && (
              <span className='caption'>
                {left >= 1
                  ? `Closes in ${left} ${left === 1 ? "day" : "days"}`
                  : "Closing soon"}
              </span>
            )}
          </p>
        )}
      </div>
    </section>
  );

  return (
    <Shell
      title={`${studentName} asked you for a letter of recommendation`}
      above={departure}
    >
      <p>
        Sent by ReadMyStudent on behalf of {studentName}
        {studentEmail && (
          <>
            {" "}
            (<span className='break-all'>{studentEmail}</span>)
          </>
        )}
        . ReadMyStudent is a service students use to request recommendation
        letters. You do not need an account.
      </p>

      {(request?.course_context || request?.student_note) && (
        <dl className='divide-y divide-rule border-y border-rule'>
          {request?.course_context && (
            <div className='py-3'>
              <dt className={dtClass}>Course or context</dt>
              <dd className='mt-1'>{request.course_context as string}</dd>
            </div>
          )}
          {request?.student_note && (
            <div className='py-3'>
              <dt className={dtClass}>Note from {studentName}</dt>
              <dd className='mt-1 whitespace-pre-line'>
                {request.student_note as string}
              </dd>
            </div>
          )}
        </dl>
      )}

      {!access.respondedAt && (
        <p className='text-sm text-ink-2'>
          If you do not start the letter or decline within {EXPIRE_AFTER_DAYS}{" "}
          days, the request closes.
        </p>
      )}

      <MarkOpened token={token} />
      <RequestLinkActions
        token={token}
        requestId={access.requestId}
        studentName={studentName}
        professorEmail={access.professorEmail}
      />

      {/* The rule spans the sheet; the text keeps the 65ch reading measure. */}
      <div className='border-t border-rule pt-4'>
        <p className='text-sm text-ink-2'>
          If you already have an account, you can{" "}
          <Link
            href='/login'
            className='inline-block py-2 font-semibold text-forest underline'
          >
            log in
          </Link>{" "}
          to see this request in your dashboard.
        </p>
      </div>
    </Shell>
  );
}
