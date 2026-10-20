import type { Metadata } from "next";
import localFont from "next/font/local";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const googleSansFlex = localFont({
  src: [
    {
      path: "../../public/fonts/GoogleSansFlex-VF.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-google-sans-flex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Infrastruktur Pasif — Tower",
  description: "Aplikasi manajemen infrastruktur pasif telekomunikasi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${googleSansFlex.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
