"use client";

import Link from "next/link";
import Image from "next/image";
import LogoOfficial from "../../../public/green_yellow_logo_sized.png";

// ✅ Import your ticker component (adjust the path to wherever you saved it)
import ScrollingProofTicker from "@/components/marketing/ScrollingProofTicker";

export default function TopBanner() {
  // ✅ Ticker items (bullets → check when centered)
  const tickerItems = [
    {
      id: "commitment-growth",
      text: "Earn Faculty Trust Through Commitment and Dedication. Grow Beyond Boundaries.",
    },
    {
      id: "commitment-dedication",
      text: "Commitment. Dedication. Earned Faculty Trust.",
    },
    {
      id: "trust-sustains-growth",
      text: "Commitment Earns Trust. Dedication Sustains It. Growth Follows.",
    },
    {
      id: "integrity-platform",
      text: "Built to Earn Faculty Trust Through Commitment, Dedication, and Integrity.",
    },
    {
      id: "platform-grow-beyond",
      text: "A Platform to Earn Faculty Trust Through Commitment and Dedication—and Grow Beyond.",
    },
    {
      id: "belief-lifetime",
      text: "Faculty Believe in You. Trust That Lasts a Lifetime.",
    },
    {
      id: "recognition-retained",
      text: "Recognition Earned. Trust Retained.",
    },
    {
      id: "earned-preserved",
      text: "Earned Faculty Trust. Preserved.",
    },
    {
      id: "faculty-stand-with-you",
      text: "Faculty Who Care About Your Work Stand With You.",
    },
    {
      id: "effort-performance-life",
      text: "Faculty Trust Your Effort and Performance—For Life.",
    },
    {
      id: "trust-doesnt-expire",
      text: "Earned Trust Doesn’t Expire.",
    },
    {
      id: "faculty-endorsed",
      text: "Faculty-Endorsed Trust, Preserved Over Time.",
    },
    {
      id: "confidence-carries-forward",
      text: "Faculty Who Care About Your Work. Confidence That Carries Forward.",
    },
    {
      id: "integrity-endures",
      text: "When Faculty Trust Your Effort and Integrity, It Should Endure.",
    },
  ];

  return (
    <header className='fixed top-0 inset-x-0 z-50 bg-[#d9dbe3]'>
      <div className='px-2 md:px-8 py-2 md:py-4'>
        <div className='flex items-center justify-center md:justify-start gap-6'>
          {/* Logo */}
          <Link href='/' className='shrink-0'>
            <Image
              src={LogoOfficial}
              alt='ReadMyStudent logo'
              width={450}
              height={400}
              priority
              className='h-24 sm:h-36 lg:h-40 xl:h-48 w-auto'
            />
          </Link>

          {/* Desktop Content Only */}
          <div className='min-w-0 w-full hidden md:block'>
            {/* Big tagline */}
            <div className='text-2xl lg:text-3xl xl:text-[44px] font-semibold text-[#0b4726] leading-tight'>
              Recommendation Letters, One Click Away
            </div>

            {/* Ticker */}
            <div className='mt-5 max-w-6xl'>
              <ScrollingProofTicker
                items={tickerItems}
                speedSeconds={130} // slower = bigger number
                centerZonePx={90} // bigger = easier to trigger check mark
              />
            </div>
          </div>
        </div>
      </div>

      <div className='h-px bg-black/10' />
    </header>
  );
}
