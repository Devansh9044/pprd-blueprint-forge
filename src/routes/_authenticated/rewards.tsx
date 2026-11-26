import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame, Award } from "lucide-react";
import { AppShell } from "@/components/mba/AppShell";
import { configQuery, meQuery } from "@/components/mba/data";
import { useT } from "@/lib/i18n";
import { liveStreak } from "@/lib/savings";

export const Route = createFileRoute("/_authenticated/rewards")({
  head: () => ({ meta: [{ title: "Rewards – MBA" }, { name: "description", content: "Your streaks, badges and offers." }] }),
  component: () => {
    const { t } = useT();
    const { data: me } = useQuery(meQuery);
    const { data: cfg } = useQuery(configQuery);
    return (
      <AppShell title={t("rewards")}>
        <div className="flex items-center gap-4 rounded-3xl bg-hero p-5 text-primary-foreground">
          <Flame className="h-12 w-12" />
          <div><p className="text-4xl font-extrabold">{liveStreak(me?.streak)}</p><p className="text-sm opacity-85">{t("streak")} · best {me?.streak?.best ?? 0}</p></div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Your streak grows by one on each day (India time) you complete a verified saving. Missing a day restarts it. Badges unlock at 7, 30 and 100 days.</p>
        <h2 className="mb-2 mt-5 text-lg font-bold text-accent">Unlocked</h2>
        <div className="space-y-2">
          {me?.rewards.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card"><Award className="h-6 w-6 text-gold" /><div><p className="font-semibold">{r.title}</p><p className="text-xs capitalize text-muted-foreground">{r.reward_status}</p></div></div>
          ))}
          {!me?.rewards.length && <p className="text-sm text-muted-foreground">Keep saving daily to unlock your first badge.</p>}
        </div>
        <div className="mt-5 rounded-2xl border border-dashed border-gold bg-card p-4 text-sm">
          <p className="font-bold text-accent">🎁 Recharge offer (proposed)</p>
          <p className="mt-1 text-muted-foreground">{cfg?.["offer_text"]}</p>
        </div>
      </AppShell>
    );
  },
});
