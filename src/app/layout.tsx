import type { Metadata } from "next";
import { JetBrains_Mono, Nunito_Sans } from "next/font/google";
import "./globals.css";

const sans = Nunito_Sans({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "600", "700", "800", "900"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "FP&P Tools",
  description: "Interne tools van FP&P",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
