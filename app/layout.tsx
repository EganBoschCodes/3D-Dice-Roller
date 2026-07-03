import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Physics Dice Roller",
  description: "DnD dice roller powered by a rigid-body physics simulation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
