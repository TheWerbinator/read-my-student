import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Something went wrong" };

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <p className='mt-3 text-ink'>
      {params?.error
        ? `Code error: ${params.error}`
        : "An unspecified error occurred."}
    </p>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  return (
    <div className='mx-auto grid max-w-xl gap-8 px-5 py-10 md:px-8 md:py-16 xl:max-w-5xl xl:grid-cols-[1fr_30rem] xl:items-start xl:gap-14'>
      <h1 className='font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-6xl'>
        Something went <span className='text-gold'>wrong</span>
      </h1>
      <div className='sheet p-6 md:p-8'>
        <p className='caption text-declined'>Stopped</p>
        <Suspense>
          <ErrorContent searchParams={searchParams} />
        </Suspense>
        <p className='mt-4 text-sm text-ink-2'>
          Go back and try again. If it keeps happening,{" "}
          <Link href='/contact' className='font-semibold text-forest underline'>
            contact us
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
