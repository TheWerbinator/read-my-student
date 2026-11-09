import type { ReactNode } from "react";
import { SiteNav } from "@/components/board/SiteNav";
import Footer from "@/components/marketing/Footer";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className='board on-board min-h-screen'>
      <SiteNav />
      <div className='lg:pl-68'>
        <main id='main' tabIndex={-1} className='outline-none'>{children}</main>
        <Footer />
      </div>
    </div>
  );
}
