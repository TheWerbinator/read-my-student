import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BoardingPassNav, type PassItem } from "@/components/board/BoardingPassNav";
import { LogoutButton } from "@/components/auth/logout-button";
import Footer from "@/components/marketing/Footer";
import { adminSession } from "@/lib/admin";
import { MfaGate } from "./MfaGate";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const items: PassItem[] = [
  { label: "Catalog", href: "/admin", note: "Prices, credits, expiry" },
  { label: "Dashboard", href: "/dashboard", note: "Back to your account" },
];

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // The page and every action check again: a layout does not re-run on every navigation.
  const session = await adminSession();
  if (!session) notFound();

  return (
    <div className='board on-board min-h-screen'>
      <BoardingPassNav items={items} stub={<LogoutButton />} />
      <div className='lg:pl-68'>
        <main id='main' tabIndex={-1} className='outline-none'>{session.mfa ? children : <MfaGate />}</main>
        <Footer compact />
      </div>
    </div>
  );
}
