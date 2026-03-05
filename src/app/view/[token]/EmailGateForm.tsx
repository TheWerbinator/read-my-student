"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, Mail, Loader2 } from "lucide-react";
import { verifyEmail } from "./actions";

export function EmailGateForm({
  token,
  schoolName,
  studentFullName,
}: {
  token: string;
  schoolName: string;
  studentFullName: string;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);

    startTransition(async () => {
      const result = await verifyEmail(token, email.trim());
      // verifyEmail redirects on success — result is only returned on error
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className='flex min-h-screen flex-col bg-gray-50'>
      {/* Header */}
      <div className='bg-green-900 px-6 py-4 shadow-sm'>
        <div className='mx-auto flex max-w-3xl items-center gap-3'>
          <ShieldCheck className='h-6 w-6 text-amber-300' />
          <span className='font-semibold tracking-wide text-white'>
            ReadMyStudent Secure Delivery
          </span>
        </div>
      </div>

      {/* Gate card */}
      <div className='flex flex-1 items-center justify-center px-4 py-16'>
        <div className='w-full max-w-md rounded-2xl border border-gray-200 bg-white p-10 shadow-sm'>
          {/* Icon */}
          <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-900/5'>
            <Mail className='h-8 w-8 text-green-900' />
          </div>

          {/* Heading */}
          <h1 className='mb-2 text-center font-serif text-2xl font-bold text-gray-900'>
            Verify your email to access this letter
          </h1>
          <p className='mb-1 text-center text-sm text-gray-500'>
            A recommendation letter for{" "}
            <span className='font-semibold text-gray-700'>
              {studentFullName}
            </span>{" "}
            has been securely delivered to{" "}
            <span className='font-semibold text-gray-700'>{schoolName}</span>.
          </p>
          <p className='mb-8 text-center text-sm text-gray-500'>
            Enter the admissions email address this letter was sent to in order
            to verify access.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label
                htmlFor='email'
                className='mb-1.5 block text-sm font-medium text-gray-700'
              >
                Admissions email address
              </label>
              <input
                id='email'
                type='email'
                autoComplete='email'
                placeholder='admissions@institution.edu'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                className='w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-green-700 disabled:opacity-50'
              />
            </div>

            {error && (
              <p className='rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700'>
                {error}
              </p>
            )}

            <button
              type='submit'
              disabled={!email.trim() || isPending}
              className='flex w-full items-center justify-center gap-2 rounded-xl bg-green-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#093820] disabled:cursor-not-allowed disabled:opacity-50'
            >
              {isPending ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Verifying…
                </>
              ) : (
                <>
                  <ShieldCheck className='h-4 w-4' />
                  Verify &amp; View Letter
                </>
              )}
            </button>
          </form>

          <p className='mt-8 text-center text-xs text-gray-400'>
            This is a single-use, time-limited secure link provided by{" "}
            <a
              href='https://readmystudent.com'
              className='underline hover:text-gray-600'
            >
              ReadMyStudent
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
