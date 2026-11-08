/**
 * /r/[token]: a professor answers one letter request from the emailed link,
 * with no account. Access rules live in authorizeRequestAccess.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import { authorizeRequestAccess } from "@/lib/request-access";
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
    <main className='min-h-screen bg-[#fbfbf8] px-4 py-10 md:py-16'>
      <div className='mx-auto max-w-2xl'>
        <p className='text-sm font-semibold tracking-wide text-green-900'>
          ReadMyStudent
        </p>
        <h1 className='mt-2 font-serif text-3xl font-semibold text-green-900'>
          {title}
        </h1>
        <div className='mt-6 space-y-4 text-green-950/80'>{children}</div>
      </div>
    </main>
  );
}

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
        <div className='rounded-xl border border-black/10 bg-white p-5'>
          <h2 className='font-semibold text-green-900'>
            Writing more letters?
          </h2>
          <p className='mt-1 text-sm'>
            A free account keeps all your requests in one place and fills in
            your details, letterhead, and signature next time.
          </p>
          <Link
            href={signupHref}
            className='mt-4 inline-block rounded-lg bg-green-900 px-4 py-2 text-sm font-semibold text-white hover:bg-[#093820]'
          >
            Create a free account
          </Link>
        </div>
      </Shell>
    );
  }

  const program = student?.program as string | null;
  const university = student?.university as string | null;

  return (
    <Shell title={`${studentName} asked you for a letter of recommendation`}>
      <dl className='grid gap-4 rounded-xl border border-black/10 bg-white p-5 sm:grid-cols-2'>
        {university && (
          <div>
            <dt className='text-xs font-semibold uppercase tracking-wide text-green-900/70'>
              University
            </dt>
            <dd className='mt-1 text-green-950'>{university}</dd>
          </div>
        )}
        {program && (
          <div>
            <dt className='text-xs font-semibold uppercase tracking-wide text-green-900/70'>
              Program
            </dt>
            <dd className='mt-1 text-green-950'>{program}</dd>
          </div>
        )}
        {request?.course_context && (
          <div className='sm:col-span-2'>
            <dt className='text-xs font-semibold uppercase tracking-wide text-green-900/70'>
              Course or context
            </dt>
            <dd className='mt-1 text-green-950'>
              {request.course_context as string}
            </dd>
          </div>
        )}
        {request?.student_note && (
          <div className='sm:col-span-2'>
            <dt className='text-xs font-semibold uppercase tracking-wide text-green-900/70'>
              Note from {studentName}
            </dt>
            <dd className='mt-1 whitespace-pre-line text-green-950'>
              {request.student_note as string}
            </dd>
          </div>
        )}
      </dl>

      <p>
        Write and sign the letter here. Your draft saves as you go, so you can
        come back to this link later. After you finalize, the letter is sealed
        and {studentName} can send it to schools.
      </p>
      {!access.respondedAt && (
        <p className='text-sm'>
          If you do not start the letter or decline within 7 days, the request
          closes.
        </p>
      )}

      <RequestLinkActions
        token={token}
        requestId={access.requestId}
        studentName={studentName}
      />

      <p className='pt-4 text-sm'>
        Already have an account?{" "}
        <Link href='/login' className='font-semibold text-green-900 underline'>
          Log in
        </Link>{" "}
        to see this request in your dashboard.
      </p>
    </Shell>
  );
}
