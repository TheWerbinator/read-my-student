import { BoardingPassNav, type PassItem } from "@/components/board/BoardingPassNav";
import { LogoutButton } from "@/components/auth/logout-button";
import Footer from "@/components/marketing/Footer";
import { adminSession } from "@/lib/admin";

const items: PassItem[] = [
  { label: "Dashboard", href: "/dashboard", note: "Your requests and letters" },
  { label: "Settings", href: "/dashboard/settings", note: "Profile, email, letterhead" },
];
const adminItem: PassItem = { label: "Admin", href: "/admin", note: "Price catalog" };

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Only admins see the link. The admin screen checks again, including the code step.
  const isAdmin = (await adminSession()) !== null;
  return (
    <div className='board on-board min-h-screen'>
      <BoardingPassNav items={isAdmin ? [...items, adminItem] : items} stub={<LogoutButton />} />
      <div className='lg:pl-68'>
        <main id='main' tabIndex={-1} className='outline-none'>{children}</main>
        <Footer compact />
      </div>
    </div>
  );
}
