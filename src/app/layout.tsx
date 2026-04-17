import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShoeScanner — Live pricing for resellers",
  description: "Scan a shoe, get live comps from eBay, StockX, and GOAT. Condition-graded pricing, fees, and time-to-sell in seconds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
