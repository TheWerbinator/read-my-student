// import SideNavbar from "@/components/marketing/SideNavbar";
import MobileNavDrawer from "@/components/marketing/MobileNavDrawer";
import TopBanner from "@/components/marketing/TopBanner";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main>
      <TopBanner />
      <MobileNavDrawer />
      {/* <SideNavbar /> */}
      <main className='mt-55'>{children}</main>
    </main>
  );
}
