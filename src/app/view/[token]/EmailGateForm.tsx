"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

import Footer from "@/components/marketing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LogoWhite from "../../../../public/Logo_Official_White.png";
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
    <div className='board on-board flex min-h-screen flex-col'>
      <header className='bg-board'>
        <div className='mx-auto flex max-w-5xl items-center gap-4 px-4 py-3'>
          <Image src={LogoWhite} alt='ReadMyStudent' className='h-10 w-auto' sizes='60px' />
          <span className='caption text-flap-dim'>Sealed letter</span>
        </div>
      </header>

      <main className='flex-1 px-4 py-8 md:py-12'>
        <div className='sheet mx-auto max-w-md p-5 md:p-8'>
          <h1 className='font-display text-2xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] text-forest-ink md:text-3xl'>
            Confirm your email to open this letter
          </h1>
          <p className='mt-4 text-sm text-ink-2'>
            A recommendation letter for{" "}
            <span className='font-semibold text-ink'>{studentFullName}</span>{" "}
            was sent by the applicant to{" "}
            <span className='font-semibold text-ink'>{schoolName}</span>.
          </p>
          <p className='mt-2 text-sm text-ink-2'>
            Enter the admissions email address this letter was sent to in order
            to verify access.
          </p>

          <form onSubmit={handleSubmit} className='mt-6 space-y-4'>
            <div>
              <label htmlFor='email' className='caption mb-1.5 block text-ink-2'>
                Admissions email address
              </label>
              <Input
                id='email'
                type='email'
                autoComplete='email'
                placeholder='admissions@institution.edu'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
              />
            </div>

            {error && (
              <p role='alert' className='border-t-2 border-declined pt-2 text-sm text-declined'>
                {error}
              </p>
            )}

            <Button
              type='submit'
              variant='gold'
              className='h-11 w-full'
              disabled={!email.trim() || isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className='animate-spin' />
                  Verifying…
                </>
              ) : (
                "Verify & View Letter"
              )}
            </Button>
          </form>

          <p className='mt-6 text-xs text-ink-2'>
            This is a time-limited secure link provided by{" "}
            <a href='https://readmystudent.com' className='underline'>
              ReadMyStudent
            </a>
            .
          </p>
        </div>
      </main>

      <Footer compact />
    </div>
  );
}
