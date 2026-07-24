import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inputs Cards — Industrial input markets",
  description: "A quiet daily dashboard for industrial biotech input markets.",
  openGraph: {
    title: "Inputs Cards",
    description: "Industrial input markets, stripped to the signal.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Inputs Cards market dashboard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Inputs Cards",
    description: "Industrial input markets, stripped to the signal.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
