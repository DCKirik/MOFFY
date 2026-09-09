import type { Metadata } from "next";
import { Righteous, Poppins } from "next/font/google";
import "./globals.css";

const righteous = Righteous({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-righteous",
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Moffy",
  description: "What should I watch? What should we watch together? What should we watch next?",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased ${righteous.variable} ${poppins.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
