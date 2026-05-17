import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// 衬線ディスプレイ — 巨大な優勝確率の数字・各見出しに使う可変フォント（opsz 軸）
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
  display: "swap",
});

// 等幅 — タグ・日付・数値注釈に使う
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "アーセナル優勝トラッカー",
  description:
    "残り試合の結果を予測してプレミアリーグの優勝確率をシミュレーション。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 本文の日本語フォントは Tailwind の font-sans（システムフォント）でまかなう。
  return (
    <html
      lang="ja"
      className={`${fraunces.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
