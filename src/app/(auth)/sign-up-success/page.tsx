import type { Metadata } from "next";

export const metadata: Metadata = { title: "Check your email" };

export default function Page() {
  return (
    <div className='mx-auto grid max-w-xl gap-8 px-5 py-10 md:px-8 md:py-16 xl:max-w-5xl xl:grid-cols-[1fr_30rem] xl:items-start xl:gap-14'>
      <h1 className='font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-6xl'>
        Check your <span className='text-gold'>email</span>
      </h1>
      <div className='sheet p-6 md:p-8'>
        <p className='caption text-ink-2'>Account created</p>
        <p className='mt-3 text-ink'>
          Thank you for signing up. We sent a link to your email. Open it to confirm your account, then sign in.
        </p>
      </div>
    </div>
  );
}
