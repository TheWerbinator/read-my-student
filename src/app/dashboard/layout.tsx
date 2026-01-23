import TopBannerDashboard from "@/components/marketing/TopBannerDashboard";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main>
      <TopBannerDashboard />
      <main>{children}</main>
    </main>
  );
}
