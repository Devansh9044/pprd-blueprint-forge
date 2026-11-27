import type { ReactNode } from "react";
import logo from "@/assets/mba-logo.png";
import { LEGAL } from "@/lib/legal";

// Public pages (login ke bina khulne wale): Privacy, Terms, Delete account.
export function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-6">
        <a href="/" className="flex items-center gap-3">
          <img src={logo} alt="MBA" width={1024} height={1024} className="h-12 w-12" />
          <span className="text-lg font-bold text-accent">{LEGAL.appName}</span>
        </a>
        <h1 className="mt-6 text-3xl font-extrabold text-accent">{title}</h1>
        <p className="mt-1 text-xs text-muted-foreground">Last updated: {LEGAL.updated}</p>
        <div className="mt-5 space-y-4 text-sm leading-relaxed text-foreground [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-accent [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_a]:font-semibold [&_a]:text-primary [&_a]:underline">
          {children}
        </div>
        <footer className="mt-10 flex flex-wrap gap-x-4 gap-y-1 border-t pt-4 text-xs text-muted-foreground">
          <a href="/privacy" className="underline">Privacy Policy</a>
          <a href="/terms" className="underline">Terms &amp; Refund Policy</a>
          <a href="/delete-account" className="underline">Delete account</a>
        </footer>
      </div>
    </main>
  );
}
