import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "MirrorMeet CRM",
  description: "CRM для интервью и расписаний",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div style={{maxWidth: 1100, margin: "0 auto", padding: "12px 16px"}}>
          <header style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0'}}>
            <div style={{fontWeight: 700}}>{process.env.NEXT_PUBLIC_APP_NAME || 'MirrorMeet CRM'}</div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
