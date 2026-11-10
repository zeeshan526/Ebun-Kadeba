import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
});

export const metadata: Metadata = {
  title: "Dr Ebun Kadeba · coming soon",
  description:
    "Dr Ebun Kadeba, FY1 Resident Doctor with the NHS. Her website opens soon.",
};

export const viewport: Viewport = {
  themeColor: "#fdf2f6",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bricolage.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
