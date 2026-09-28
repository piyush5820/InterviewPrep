/** @jsxImportSource react */
import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "../styles/globals.css";
import { ToastProvider } from "@/components/ToastProvide";
import { Toaster } from "react-hot-toast";

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const displayFont = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PreplystHub - AI",
  description: "Your Dream Job interview selection in just few clicks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bodyFont.variable} ${displayFont.variable} antialiased bg-[#f3f6f8] text-[#0f1e2e]`}
      >
        <ToastProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#0f1e2e",
                color: "#fff",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
              },
            }}
          />
        </ToastProvider>
      </body>
    </html>
  );
}
