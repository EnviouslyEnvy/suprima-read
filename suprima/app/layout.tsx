import type { Metadata } from "next";
import "./globals.css";
import { HOME_TITLE } from "@/lib/flavor";
export const metadata: Metadata = {
  title: HOME_TITLE,
  description:
    "Turn lengthy text into clear reading briefs, then read one word at a time at your own pace.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
