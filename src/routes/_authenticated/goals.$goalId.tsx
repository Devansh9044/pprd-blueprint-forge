import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/mba/AppShell";
import { PayDialog } from "@/components/mba/PayDialog";
import { goalsQuery, txQuery } from "@/components/mba/data";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { inr, round2 } from "@/lib/savings";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/goals/$goalId")({
  validateSearch: (s: Record<string, unknown>) => ({ pay: s.pay === true || s.pay === "true" }),
  head: () => ({ meta: [{ title: "Goal – MBA" }, { name: "description", content: "Your saving goal progress." }] }),
  component: GoalPage,
});

function GoalPage() {
  const { goalId } = Route.useParams();
  const { pay } = Route.useSearch();
  const { t } = useT();
  const qc = useQueryClient();
  const [open, setOpen] = useState(pay);
  const { data: goals, isLoading } = useQuery(goalsQuery);
  const { data: tx = [] } = useQuery(txQuery);
  const g = goals?.find((x) => x.id === goalId);
  if (isLoading) return <AppShell title="…" back><p /></AppShell>;
  if (!g) return <AppShell title="Goal" back><p className="py-10 text-center text-muted-foreground">Goal not found.</p></AppShell>;
  const saved = Number(g.saved_amount), total = Number(g.goal_amount);
  const pct = Math.min(100, (saved / total) * 100);
  const togglePause = async () => {
    const { error } = await supabase.from("saving_goals").update({ status: g.status === "paused" ? "active" : "paused" }).eq("id", g.id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["goals"] });
  };
  const rows = [
    ["Daily saving", inr(Number(g.daily_saving))], ["Remaining", inr(round2(total - saved))],
    ["Started", g.start_date], ["Target date", g.end_date ?? "—"], ["Status", g.status],
    ...((g.meta as Record<string, string>)?.mobile_number ? [["Mobile", (g.meta as Record<string, string>).mobile_number]] : []),
  ];
  return (
    <AppShell title={g.goal_name} back>
      <div className="rounded-3xl bg-hero p-5 text-primary-foreground">
        <p className="text-sm opacity-80">Saved</p>
        <p className="text-4xl font-extrabold font-display">{inr(saved)}</p>
        <p className="text-sm opacity-90">of {inr(total)} · {pct.toFixed(1)}%</p>
        <Progress value={pct} className="mt-3 h-3 bg-primary-foreground/25" />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2">
        {rows.map(([k, v]) => (<div key={k} className="rounded-2xl bg-card p-3 shadow-card"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-bold capitalize">{v}</dd></div>))}
      </dl>
      {g.status === "active" && <Button onClick={() => setOpen(true)} className="mt-4 h-12 w-full rounded-xl text-base font-bold">{t("payToday")} · {inr(Number(g.daily_saving))}</Button>}
      {g.status !== "completed" && <Button variant="outline" onClick={togglePause} className="mt-2 w-full rounded-xl">{g.status === "paused" ? "Resume goal" : "Pause goal"}</Button>}
      <h2 className="mb-2 mt-6 text-lg font-bold text-accent">{t("history")}</h2>
      <div className="space-y-2">
        {tx.filter((x) => x.goal_id === g.id && x.payment_status === "verified").map((x) => (
          <div key={x.id} className="flex justify-between rounded-xl bg-card p-3 text-sm shadow-card">
            <span>{new Date(x.verified_at!).toLocaleDateString("en-IN")}</span><b className="text-success">+{inr(Number(x.amount))}</b>
          </div>
        ))}
      </div>
      <PayDialog goalId={g.id} open={open} onOpenChange={setOpen} />
    </AppShell>
  );
}
