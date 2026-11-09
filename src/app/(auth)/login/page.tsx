import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Log in" };

export default function Page() {
  return (
    <div className='mx-auto grid max-w-xl gap-8 px-5 py-10 md:px-8 md:py-16 xl:max-w-5xl xl:grid-cols-[1fr_30rem] xl:items-start xl:gap-14'>
      <div>
        <h1 className='font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-6xl'>
          Welcome <span className='text-gold'>back</span>
        </h1>
        <p className='mt-4 max-w-sm text-lg leading-relaxed text-flap-ink/85'>
          Sign in to see where your requests and letters stand.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
