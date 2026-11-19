import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/mba/AppShell";
import { goalsQuery, txQuery, PAYMENT_STATUS } from "@/components/mba/data";
import { Progress } from "@/components/ui/progress";
import { inr } from "@/lib/savings";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/goals/")({
  head: () => ({ meta: [{ title: "My Goals – MBA" }, { name: "description", content: "Track your saving goals and history." }] }),
  component: GoalsPage,
});

function GoalsPage() {
  const { t } = useT();
  const [tab, setTab] = useState<"active" | "completed" | "history">("active");
  const { data: goals = [] } = useQuery(goalsQuery);
  const { data: tx = [] } = useQuery(txQuery);
  const list = goals.filter((g) => (tab === "completed" ? g.status === "completed" : g.status !== "completed"));
  return (
    <AppShell title={t("goals")}>
      <div className="mb-4 grid grid-cols-3 rounded-2xl bg-card p-1 shadow-card">
        {(["active", "completed", "history"] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-xl py-2 text-sm font-bold capitalize ${tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{k === "history" ? t("history") : k}</button>
        ))}
      </div>
      {tab === "history" ? (
        <div className="space-y-2">
          {tx.map((x) => (
            <div key={x.id} className="rounded-2xl bg-card p-3 shadow-card">
              <div className="flex justify-between"><p className="font-semibold">{x.saving_goals?.goal_name}</p><p className="font-bold text-accent">{inr(Number(x.amount))}</p></div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{x.utr ? `UTR ${x.utr}` : x.provider_order_id} · {x.payment_provider === "upi" ? "UPI" : "UPI (demo)"}</span>
                <span className={x.payment_status === "verified" ? "text-success font-semibold" : x.payment_status === "rejected" ? "text-destructive font-semibold" : ""}>{PAYMENT_STATUS[x.payment_status] ?? x.payment_status}</span>
              </div>
              <p className="text-xs text-muted-foreground">{new Date(x.created_at).toLocaleString("en-IN")}</p>
            </div>
          ))}
          {!tx.length && <p className="py-10 text-center text-muted-foreground">No transactions yet.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((g) => {
            const pct = Math.min(100, (Number(g.saved_amount) / Number(g.goal_amount)) * 100);
            return (
              <Link key={g.id} to="/goals/$goalId" params={{ goalId: g.id }} search={{ pay: false }} className="block rounded-2xl bg-card p-4 shadow-card">
                <div className="flex justify-between"><p className="font-bold">{g.goal_name}</p><span className="text-xs capitalize text-muted-foreground">{g.status}</span></div>
                <p className="text-sm text-muted-foreground">{inr(Number(g.saved_amount))} of {inr(Number(g.goal_amount))} · {inr(Number(g.daily_saving) + Number(g.fee_per_day ?? 0))}{t("perDay")}</p>
                <Progress value={pct} className="mt-2 h-2" />
              </Link>
            );
          })}
          {!list.length && <p className="py-10 text-center text-muted-foreground">No goals here yet. <Link to="/home" className="text-primary font-semibold">Start one</Link></p>}
        </div>
      )}
    </AppShell>
  );
}
