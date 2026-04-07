import type { Metadata } from "next";
import { Inter, Newsreader, Noto_Serif_SC } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-newsreader',
  style: ['normal', 'italic'],
});

const notoSerifSC = Noto_Serif_SC({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto-serif-sc',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: "AI Demo Day | Xiaohongshu",
  description: "AI Demo Day Platform - Xiaohongshu Strategy / Investment / User Research",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`h-full ${inter.variable} ${newsreader.variable} ${notoSerifSC.variable}`}>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
