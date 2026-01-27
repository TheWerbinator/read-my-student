import TopBannerDashboard from "@/components/marketing/TopBannerDashboard";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main>
      <TopBannerDashboard />
      {children}
    </main>
  );
}
