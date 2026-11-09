import type { Metadata } from "next";
import { Big_Shoulders, Public_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

// Board lettering: condensed caps from Chicago street signage.
const board = Big_Shoulders({
  variable: "--font-board",
  subsets: ["latin"],
  axes: ["opsz"],
  // next/font has no fallback metrics for this family.
  adjustFontFallback: false,
});

// Body: the US government's web typeface, legible on small phones.
const body = Public_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

// NEXT_PUBLIC_SITE_URL already includes the scheme (see .env.example).
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),

  // 2. SEO Title & Description
  title: {
    default: "ReadMyStudent | The Secure Academic Recommendations Platform",
    template: "%s | ReadMyStudent", // This allows sub-pages to look like: "Login | ReadMyStudent"
  },
  description:
    "Simplify the academic letter of recommendation process. ReadMyStudent helps faculty manage requests and write secure references, saving time while ensuring student privacy.",

  // 3. OpenGraph (Facebook, LinkedIn, iMessage, Slack)
  openGraph: {
    title: "ReadMyStudent | Secure Academic Recommendations",
    description:
      "The trusted platform for requesting, writing, and managing academic recommendation letters simply and securely.",
    url: baseUrl,
    siteName: "ReadMyStudent",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png", // We will create this file next
        width: 1200,
        height: 630,
        alt: "ReadMyStudent Platform",
      },
    ],
  },

  // 4. Twitter Card (X)
  twitter: {
    card: "summary_large_image",
    title: "ReadMyStudent",
    description:
      "Secure, respectful recommendation letters for students and faculty.",
    images: ["/og-image.png"], // Re-using the OG image
  },

  // 5. Icons
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png", // Optional, if you have it
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${board.variable} ${body.variable} antialiased`}>
        {children}
        <Toaster richColors position='top-center' />
      </body>
    </html>
  );
}
