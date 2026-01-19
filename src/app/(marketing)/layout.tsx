import type { ReactNode } from "react";
import SideNavbar from "@/components/marketing/SideNavbar";
import MobileNavDrawer from "@/components/marketing/MobileNavDrawer";
import TopBanner from "@/components/marketing/TopBanner";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className='min-h-screen flex flex-col bg-white text-black'>
      <TopBanner />
      <MobileNavDrawer />
      <SideNavbar />
      <main className='pt-24 lg:pt-36'>{children}</main>
    </div>
  );
}
