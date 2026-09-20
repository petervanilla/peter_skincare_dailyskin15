import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Source_Serif_4 } from "next/font/google";
import { RouteTransition } from "@/components/RouteTransition";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DailySkin 15",
  description: "하루 30초. 같은 얼굴을 기록하면 변화가 보입니다.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#faf9f5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${hanken.variable} ${sourceSerif.variable}`}>
      <head>
        {/*
          Material Symbols is not in next/font's Google catalogue, so it is
          linked directly. The no-page-custom-font rule targets pages/_document;
          in the App Router this <head> applies to every route.
        */}
        {/*
          display=block is deliberate for an icon font: with swap the browser
          paints the ligature text ("settings", "check") before the font
          arrives, which looks broken.
        */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font, @next/next/google-font-display */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          rel="stylesheet"
        />
      </head>
      <body>
        <StoreProvider>
          {/* The designs are iPhone frames; centre them and cap the width. */}
          <div className="mx-auto min-h-dvh w-full max-w-[430px] overflow-x-hidden bg-background shadow-[0_0_60px_rgba(0,67,57,0.06)]">
            <RouteTransition>{children}</RouteTransition>
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
