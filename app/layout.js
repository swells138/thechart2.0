import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "The Chart 2.0",
  description: "Explore relationships through an interactive force-directed graph.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="bg-slate-950">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}> 
        <Header />
        <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">{children}</main>
      </body>
    </html>
  );
}
