import type { Metadata, Viewport } from "next";
import {
  Cormorant_Garamond,
  IM_Fell_English,
  Special_Elite,
} from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import "./globals.css";

const fell = IM_Fell_English({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-fell",
  display: "swap",
});

const elite = Special_Elite({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-elite",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "IMPOSER — A Wake for Liars",
    template: "%s · IMPOSER",
  },
  description:
    "A social deduction game of borrowed memories. One of you has no memory of the night. Find the imposters before they name what they cannot remember.",
  applicationName: "IMPOSER",
  keywords: [
    "social deduction game",
    "word game",
    "online party game",
    "imposter",
    "multiplayer",
  ],
  openGraph: {
    title: "IMPOSER — A Wake for Liars",
    description:
      "Everyone remembers the night. Everyone except one. A word-based social deduction game for 3–12 players.",
    type: "website",
    siteName: "IMPOSER",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "IMPOSER — A Wake for Liars",
    description:
      "Everyone remembers the night. Everyone except one. A word-based social deduction game for 3–12 players.",
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    title: "IMPOSER",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#090807",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fell.variable} ${elite.variable} ${cormorant.variable} antialiased`}
    >
      <body>
        <Providers>
          <div className="page-frame">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
