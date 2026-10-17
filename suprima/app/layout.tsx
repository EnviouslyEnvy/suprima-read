import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Suprima — A clearer way to read",
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
