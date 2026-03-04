import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/nav/BottomNav";

export const metadata: Metadata = {
  title: "Mosaic",
  description: "Understand media bias across left, center, and right perspectives",
  icons: { icon: "/mosaic.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: "var(--color-app-bg)" }}>
        <main
          style={{
            minHeight: "100vh",
            paddingBottom: "calc(var(--nav-height) + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
