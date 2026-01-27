import TopBanner from "@/components/marketing/TopBanner";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main>
      <TopBanner />
      {children}
    </main>
  );
}
