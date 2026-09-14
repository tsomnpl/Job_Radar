import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { isClerkConfigured } from "@/lib/env";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobRadar — AI Opportunity Intelligence",
  description:
    "Recherche d'opportunités en langage naturel, matching explicable, parsing de CV et import d'offres. Propulsé par Clerk et RodiumAI.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const clerkEnabled = isClerkConfigured();
  const body = (
    <>
      <SiteHeader clerkEnabled={clerkEnabled} demo={!clerkEnabled} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-[#1c3a4d] px-4 py-6 text-center text-xs text-[#8eacb0]">
        JobRadar · intelligence d&apos;opportunités · hors FlyerMint
      </footer>
    </>
  );

  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {clerkEnabled ? <ClerkProvider>{body}</ClerkProvider> : body}
      </body>
    </html>
  );
}
