import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Smartphone, Laptop, Bike, GraduationCap, Wallet, Signal, Flame, Target, Gift } from "lucide-react";
import { AppShell } from "@/components/mba/AppShell";
import { goalsQuery, meQuery } from "@/components/mba/data";
import { useT, type Key } from "@/lib/i18n";
import { inr } from "@/lib/savings";
import logo from "@/assets/mba-logo.png";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Home – MBA Savings" }, { name: "description", content: "Your MBA savings dashboard." }] }),
  component: HomePage,
});

const modules: { to: string; key: Key; icon: typeof Smartphone }[] = [
  { to: "/recharge", key: "recharge", icon: Signal },
  { to: "/mobile", key: "mobile", icon: Smartphone },
  { to: "/laptop", key: "laptop", icon: Laptop },
  { to: "/bike", key: "bike", icon: Bike },
  { to: "/college", key: "college", icon: GraduationCap },
  { to: "/custom", key: "custom", icon: Wallet },
];

function HomePage() {
  const { t } = useT();
  const { data: me } = useQuery(meQuery);
  const { data: goals = [] } = useQuery(goalsQuery);
  const total = goals.reduce((s, g) => s + Number(g.saved_amount), 0);
  const active = goals.filter((g) => g.status === "active").length;
  const stats = [
    { label: t("streak"), value: me?.streak?.current ?? 0, icon: Flame },
    { label: t("activeGoals"), value: active, icon: Target },
    { label: t("rewards"), value: me?.rewards.length ?? 0, icon: Gift },
  ];
  return (
    <AppShell>
      <section className="-mx-4 rounded-b-3xl bg-hero px-5 pb-6 pt-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <p className="text-lg">{t("hello")}, <b>{me?.profile?.full_name?.split(" ")[0] || "User"}</b> 👋</p>
          <img src={logo} alt="MBA" width={1024} height={1024} className="h-10 w-10 rounded-xl bg-card" />
        </div>
        <p className="mt-4 text-sm opacity-80">{t("totalSaving")}</p>
        <p className="font-display text-4xl font-extrabold">{inr(total)}</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {stats.map(({ label, value, icon: I }) => (
            <div key={label} className="rounded-2xl bg-primary-foreground/15 p-2 text-center">
              <I className="mx-auto h-4 w-4" /><p className="text-xl font-bold">{value}</p><p className="text-[11px] opacity-85">{label}</p>
            </div>
          ))}
        </div>
      </section>
      <div className="mt-5 grid grid-cols-3 gap-3">
        {modules.map(({ to, key, icon: I }) => (
          <Link key={to} to={to} className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl bg-card p-2 text-center shadow-card transition active:scale-95">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft"><I className="h-6 w-6 text-accent" /></span>
            <span className="text-xs font-semibold leading-tight">{t(key)}</span>
          </Link>
        ))}
      </div>
      <p className="mt-6 text-center text-sm font-semibold text-primary">{t("tagline")}</p>
    </AppShell>
  );
}
