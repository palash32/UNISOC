import type { Metadata } from "next";
// Auth disabled — will re-enable for client handover
// import { ClerkProvider } from "@clerk/nextjs";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "UniSpark Suraksha — AI Security Assessment Platform",
  description:
    "AI-powered security assessment platform by UniSpark Innovation. Scan websites, analyze threats, and generate professional security reports.",
  keywords: ["security assessment", "vulnerability scanner", "threat intelligence", "UniSpark", "Suraksha"],
  openGraph: {
    title: "UniSpark Suraksha — AI Security Assessment Platform",
    description: "Scan. Analyze. Protect. — Professional security assessment powered by AI.",
    url: "https://unisparksuraksha.ai",
    siteName: "UniSpark Suraksha",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${inter.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
