import { SiteNav } from "@/components/board/SiteNav";
import Footer from "@/components/marketing/Footer";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className='board on-board min-h-screen'>
      <SiteNav />
      <div className='lg:pl-68'>
        <main>{children}</main>
        <Footer />
      </div>
    </div>
  );
}
