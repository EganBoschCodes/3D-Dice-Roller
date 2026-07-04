import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Physics Dice Roller",
  description: "DnD dice roller powered by a rigid-body physics simulation",
};

// Fullscreen 3D "app" feel on phones: fill the device (incl. notch cutouts) and
// lock zoom so pinch/double-tap can't fight the tray gestures.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
