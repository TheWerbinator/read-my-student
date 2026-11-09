/**
 * /r/[token]: a professor answers one letter request from the emailed link,
 * with no account. Access rules live in authorizeRequestAccess.
 */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import Footer from "@/components/marketing/Footer";
import { LinkButton } from "@/components/ui/LinkButton";
import { authorizeRequestAccess } from "@/lib/request-access";
import LogoWhite from "../../../../public/Logo_Official_White.png";
import { RequestLinkActions } from "./RequestLinkActions";

export const metadata: Metadata = {
  title: "Letter request | ReadMyStudent",
  robots: { index: false, follow: false },
  // The token is in the URL, so never send it to other sites.
  referrer: "no-referrer",
};

const admin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function Shell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className='board on-board flex min-h-screen flex-col'>
      <header className='bg-board'>
        <div className='mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3'>
          <Image src={LogoWhite} alt='ReadMyStudent' className='h-8 w-auto' />
          <span className='caption text-flap-dim'>Letter request</span>
        </div>
      </header>
      <main className='flex-1 px-4 py-6 md:py-12'>
        <div className='sheet mx-auto max-w-2xl p-5 md:p-8'>
          <h1 className='font-display text-2xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] text-forest-ink md:text-3xl'>
            {title}
          </h1>
          <div className='mt-5 space-y-4 text-ink'>{children}</div>
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

  return (
    <Shell title={`${studentName} asked you for a letter of recommendation`}>
      <dl className='divide-y divide-rule border-y border-rule'>
        <div className='py-3'>
          <dt className={dtClass}>Requested by</dt>
          <dd className='mt-1'>
            {studentName}
            {studentEmail && (
              <span className='block break-all text-sm text-ink-2'>
                {studentEmail}
              </span>
            )}
          </dd>
        </div>
        {university && (
          <div className='py-3'>
            <dt className={dtClass}>University</dt>
            <dd className='mt-1'>{university}</dd>
          </div>
        )}
        {program && (
          <div className='py-3'>
            <dt className={dtClass}>Program</dt>
            <dd className='mt-1'>{program}</dd>
          </div>
        )}
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

      <p>
        Write and sign the letter here. Your draft saves as you go, so you can
        come back to this link later.
      </p>
      <p className='text-sm text-ink-2'>
        When you finalize, the letter is sealed as a signed PDF and can no
        longer be edited. {studentName} can then send it to schools, and sees
        the letter only if you turn on preview.
      </p>
      {!access.respondedAt && (
        <p className='text-sm text-ink-2'>
          If you do not start the letter or decline within 7 days, the request
          closes.
        </p>
      )}

      <RequestLinkActions
        token={token}
        requestId={access.requestId}
        studentName={studentName}
        professorEmail={access.professorEmail}
      />

      <p className='border-t border-rule pt-4 text-sm text-ink-2'>
        You do not need an account. If you already have one, you can{" "}
        <Link
          href='/login'
          className='inline-block py-2 font-semibold text-forest underline'
        >
          log in
        </Link>{" "}
        to see this request in your dashboard.
      </p>
    </Shell>
  );
}
