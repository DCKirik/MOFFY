import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moffy",
  description: "What should I watch? What should we watch together? What should we watch next?",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
