import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header  from "@/components/Header";
import { ThemeProvider } from "../components/ThemeProvider";
import { ReactionProvider } from "../components/ReactionContext";
import { AuthBackground } from "@/components/AuthBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Whispurr",
  description: "A social media platform for you",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ReactionProvider>
            <AuthBackground />
            <Header />
            {/* Spacer to offset fixed header height */}
            <div aria-hidden className="h-16" />
            {children}
          </ReactionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
