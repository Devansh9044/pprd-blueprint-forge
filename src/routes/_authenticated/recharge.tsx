import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/mba/AppShell";
import { configQuery, meQuery, productsQuery } from "@/components/mba/data";
import { createGoal } from "@/lib/goals.functions";
import { inr } from "@/lib/savings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/recharge")({
  head: () => ({ meta: [{ title: "Mobile Recharge Saving – MBA" }, { name: "description", content: "Save daily for your next 28, 56 or 84-day recharge." }] }),
  component: RechargePage,
});

function RechargePage() {
  const { t } = useT();
  const { data = [] } = useQuery(productsQuery("recharge"));
  const { data: cfg } = useQuery(configQuery);
  const { data: me } = useQuery(meQuery);
  const durations = [...new Set(data.map((p) => p.brand))];
  const [dur, setDur] = useState("56 Days");
  const [pid, setPid] = useState<string | null>(null);
  const [mobile, setMobile] = useState("");
  const create = useServerFn(createGoal);
  const nav = useNavigate();
  const plans = data.filter((p) => p.brand === dur && p.enabled);
  const sel = plans.find((p) => p.id === pid);
  const num = mobile || me?.profile?.mobile_number || "";

  const go = async () => {
    if (!sel) return;
    try { const g = await create({ data: { kind: "product", productId: sel.id, mobileNumber: num } }); nav({ to: "/goals/$goalId", params: { goalId: g.id }, search: { pay: true } }); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <AppShell title={t("recharge")} back>
      <p className="mb-2 text-sm font-semibold">1. Duration</p>
      <div className="grid grid-cols-3 gap-2">
        {durations.map((d) => (
          <button key={d} onClick={() => { setDur(d); setPid(null); }} className={`rounded-xl border py-3 font-bold ${dur === d ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{d}</button>
        ))}
      </div>
      <p className="mb-2 mt-5 text-sm font-semibold">2. Data plan</p>
      <div className="grid grid-cols-2 gap-2">
        {plans.map((p) => (
          <button key={p.id} onClick={() => setPid(p.id)} className={`rounded-2xl border p-4 text-left ${pid === p.id ? "border-primary ring-2 ring-primary" : "bg-card"}`}>
            <p className="font-bold">{p.name}</p>
            <p className="text-xl font-extrabold text-accent">{inr(Number(p.display_daily))}<span className="text-xs text-muted-foreground">{t("perDay")}</span></p>
            <p className="text-xs text-muted-foreground">Plan value {inr(Number(p.display_daily) * p.duration_days)}</p>
            {p.pending && <p className="mt-1 text-[11px] font-semibold text-destructive">Price pending confirmation</p>}
          </button>
        ))}
      </div>
      <p className="mb-2 mt-5 text-sm font-semibold">3. Mobile number</p>
      <Input inputMode="numeric" maxLength={10} placeholder="10-digit number" value={num} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))} />
      {sel && (
        <div className="mt-5 rounded-2xl bg-primary-soft p-4">
          <p className="text-sm">Save <b>{inr(Number(sel.display_daily))}</b> daily for {sel.duration_days} days → <b>{inr(Number(sel.display_daily) * sel.duration_days)}</b> for your {dur} {sel.name} recharge.</p>
        </div>
      )}
      <Button disabled={!sel} onClick={go} className="mt-4 h-12 w-full rounded-xl text-base font-bold">{t("startSaving")}</Button>
      <div className="mt-6 rounded-2xl border border-dashed border-gold bg-card p-4 text-sm">
        <p className="font-bold text-accent">🎁 Recharge offer (proposed)</p>
        <p className="mt-1 text-muted-foreground">{cfg?.["offer_text"]}</p>
      </div>
    </AppShell>
  );
}
