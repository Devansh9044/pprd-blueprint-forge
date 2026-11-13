import { Link, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowLeft, Home, Target, Gift, Settings, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useT } from "@/lib/i18n";
import { meQuery } from "./data";

export function AppShell({ title, back, children }: { title?: string; back?: boolean; children: ReactNode }) {
  const { t } = useT();
  const router = useRouter();
  const { data: me } = useQuery(meQuery);
  const items = [
    { to: "/home", icon: Home, label: t("home") },
    { to: "/goals", icon: Target, label: t("goals") },
    { to: "/rewards", icon: Gift, label: t("rewards") },
    { to: "/settings", icon: Settings, label: t("settings") },
    ...(me?.isAdmin ? [{ to: "/admin", icon: Shield, label: "Admin" }] : []),
  ] as const;
  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-24">
      {title && (
        <header className="sticky top-0 z-10 flex items-center gap-3 bg-background/90 px-4 py-4 backdrop-blur">
          {back && <button onClick={() => router.history.back()} aria-label="Back" className="rounded-full bg-card p-2 shadow-card"><ArrowLeft className="h-5 w-5 text-accent" /></button>}
          <h1 className="text-2xl font-bold text-accent">{title}</h1>
        </header>
      )}
      <div className="px-4">{children}</div>
      <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-md -translate-x-1/2 justify-around border-t bg-card py-2">
        {items.map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-muted-foreground"
            activeProps={{ className: "text-primary font-semibold" }}>
            <Icon className="h-5 w-5" />{label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
