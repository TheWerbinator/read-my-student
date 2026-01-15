import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Later: AppTopBar / AppSidebar */}
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}