"use client";

import { LinkButton } from "../ui/LinkButton";
import { HeroStepper } from "./Stepper";

export default function Hero() {
  return (
    <section className='relative overflow-hidden bg-[#0b4726] mt-36'>
      {/* Soft gradient + texture */}
      <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0)_55%)]' />
      <div className='absolute inset-0 opacity-[0.10] bg-[radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] bg-size-[32px_32px]' />

      {/* Subtle bottom shadow band */}
      <div className='absolute inset-x-0 bottom-0 h-16 bg-black/20 blur-2xl' />

      <div className='relative mx-auto max-w-7xl px-6 py-10 sm:py-16 md:py-40'>
        {/* Badge */}
        <div className='flex justify-center'>
          <div className='inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white/80'>
            <span className='h-2 w-2 rounded-full bg-amber-400' />
            The Trusted Platform for Academic Recommendations
          </div>
        </div>

        {/* Title */}
        <h1 className='mt-6 sm:mt-10 text-center font-serif font-semibold tracking-tight text-white text-3xl sm:text-4xl md:text-7xl'>
          Secure, Respectful{" "}
          <span className='block'>
            <span className='italic text-amber-400'>Recommendation</span>
          </span>
          <span className='block italic text-amber-400'>Letters</span>
        </h1>

        {/* Subtitle */}
        <p className='mx-auto mt-6 max-w-2xl text-center text-base md:text-lg text-white/70 leading-relaxed'>
          A warm, trustworthy platform where students request and share
          recommendation letters, and faculty write and manage them—all with
          consent-based access and bank-grade encryption.
        </p>

        {/* CTAs */}
        <div className='mt-10 flex flex-col sm:flex-row items-center justify-center gap-4'>
          <LinkButton
            href='/signup?role=student'
            variant='gold'
            size='lg'
            className='min-w-56 justify-center rounded-xl'
          >
            Students
          </LinkButton>

          <LinkButton
            href='/signup?role=faculty'
            variant='secondary'
            size='lg'
            className='min-w-56 justify-center rounded-xl bg-white/10 text-white hover:bg-white/15 border border-white/20'
          >
            Faculty
          </LinkButton>
        </div>

        <div className='hidden [@media(min-width:371px)]:block mt-12'>
          <HeroStepper />
        </div>
      </div>
    </section>
  );
}
