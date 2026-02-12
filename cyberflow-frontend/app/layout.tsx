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
  title: "UniSOC Toolkit - Security Operations Center Assessment",
  description:
    "Multi-tenant SOC Assessment Toolkit for security analysts, incident responders, and threat researchers.",
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
