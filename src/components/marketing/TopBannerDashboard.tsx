"use client";

import Link from "next/link";
import Image from "next/image";
import LogoOfficial from "../../../public/green_yellow_logo_sized.png";
import { LogoutButton } from "@/components/auth/logout-button";

export default function TopBannerDashboard() {
  return (
    <header className='bg-white/90 backdrop-blur-sm lg:mx-12'>
      <div className='px-4 md:px-8 py-3 flex items-center justify-between gap-4'>
        <Link href='/' className='flex items-center gap-3'>
          <Image
            src={LogoOfficial}
            alt='ReadMyStudent logo'
            width={160}
            height={48}
            className='h-10 w-auto'
          />
          <span className='hidden sm:inline-block font-semibold text-sm text-[#0b4726]'>
            Dashboard
          </span>
        </Link>

        <div className='ml-auto flex items-center gap-3'>
          <LogoutButton />
        </div>
      </div>

      <div className='h-px bg-black/5' />
    </header>
  );
}
