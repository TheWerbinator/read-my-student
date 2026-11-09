import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = { title: "Sign up" };
import { Suspense } from "react";

export default function Page() {
  return (
    <div className='mx-auto grid max-w-2xl gap-8 px-5 py-10 md:px-8 md:py-16 xl:max-w-5xl xl:grid-cols-[1fr_32rem] xl:items-start xl:gap-14'>
      <div>
        <h1 className='font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-6xl'>
          Open your <span className='text-gold'>account</span>
        </h1>
        <dl className='mt-6 max-w-sm divide-y divide-flap border-y border-flap text-flap-ink/85'>
          <div className='py-3'>
            <dt className='caption text-flap-dim'>Students</dt>
            <dd className='mt-1'>Ask a professor for a letter and send it to each school.</dd>
          </div>
          <div className='py-3'>
            <dt className='caption text-flap-dim'>Professors</dt>
            <dd className='mt-1'>Answer requests from an emailed link. You never pay.</dd>
          </div>
        </dl>
      </div>
      <Suspense fallback={<div className='sheet p-6 text-ink-2'>Loading form...</div>}>
        <SignUpForm />
      </Suspense>
    </div>
  );
}
