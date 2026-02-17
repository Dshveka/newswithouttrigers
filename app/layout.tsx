import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "חדשות ללא טריגרים",
  description: "עדכון חיוני, רגוע וקצר לאזרחי ישראל"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
