import { BoardingPassNav, type PassItem } from "@/components/board/BoardingPassNav";
import { LogoutButton } from "@/components/auth/logout-button";
import Footer from "@/components/marketing/Footer";

const items: PassItem[] = [
  { label: "Dashboard", href: "/dashboard", note: "Your requests and letters" },
  { label: "Settings", href: "/dashboard/settings", note: "Profile, email, letterhead" },
];

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className='board on-board min-h-screen'>
      <BoardingPassNav items={items} stub={<LogoutButton />} />
      <div className='lg:pl-68'>
        <main>{children}</main>
        <Footer compact />
      </div>
    </div>
  );
}
