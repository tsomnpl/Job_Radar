import type { Metadata } from "next";
import Link from "next/link";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { CommandPalette } from "@/components/command-palette";
import { ThemeProvider } from "@/components/theme-provider";
import { getSessionUser } from "@/lib/auth";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { clerkClientProxyUrl, isClerkConfigured, isClerkProduction } from "@/lib/env";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000"),
  title: {
    default: "JobRadar — Your next opportunity, before you miss it.",
    template: "%s — JobRadar",
  },
  description:
    "Radar d'opportunités : emplois, stages, missions, ONG et organisations internationales. Recherche en langage naturel, matching IA explicable, CV et surveillance.",
  openGraph: {
    title: "JobRadar — Your next opportunity, before you miss it.",
    description:
      "Find real internships, jobs, and missions. JobRadar never invents companies, deadlines, or application URLs.",
    url: "/",
    siteName: "JobRadar",
    images: [{ url: "/brand/jobradar-logo.png", width: 512, height: 512, alt: "JobRadar logo" }],
    locale: "fr_FR",
    type: "website",
  },
};

const THEME_BOOTSTRAP = `try{if(localStorage.getItem('jobradar-theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const clerkEnabled = isClerkConfigured();
  const user = await getSessionUser();
  const signedIn = Boolean(user) && (!clerkEnabled || !user?.isDemo);
  const body = (
    <ThemeProvider>
      <SiteHeader clerkEnabled={clerkEnabled} signedIn={signedIn} isAdmin={user?.role === "ADMIN"} />
      <CommandPalette signedIn={signedIn} />
      <main className="site-main mx-auto min-h-[70vh] w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-line px-4 py-6 text-center text-xs text-muted">
        <p>JobRadar · Your next opportunity, before you miss it.</p>
        <p className="mt-2 flex justify-center gap-4">
          <Link href="/privacy" className="hover:text-accent">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-accent">
            Terms
          </Link>
        </p>
      </footer>
    </ThemeProvider>
  );

  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="flex min-h-full flex-col">
        {clerkEnabled ? (
          <ClerkProvider
            appearance={clerkAppearance}
            {...(isClerkProduction() ? { proxyUrl: clerkClientProxyUrl() } : {})}
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
            signInFallbackRedirectUrl="/dashboard"
            signUpFallbackRedirectUrl="/dashboard"
          >
            {body}
          </ClerkProvider>
        ) : (
          body
        )}
      </body>
    </html>
  );
}
