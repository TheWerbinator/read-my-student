import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BoardingPassNav, type PassItem } from "@/components/board/BoardingPassNav";
import { LogoutButton } from "@/components/auth/logout-button";
import Footer from "@/components/marketing/Footer";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const items: PassItem[] = [{ label: "Catalog", href: "/admin", note: "Prices, credits, expiry" }];

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // The page and every action check again: a layout does not re-run on every navigation.
  if (!(await requireAdmin())) notFound();

  return (
    <div className='board on-board min-h-screen'>
      <BoardingPassNav items={items} stub={<LogoutButton />} />
      <div className='lg:pl-68'>
        <main id='main' tabIndex={-1} className='outline-none'>{children}</main>
        <Footer compact />
      </div>
    </div>
  );
}
