import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/mba/AppShell";
import { configQuery, meQuery, productsQuery } from "@/components/mba/data";
import { createGoal } from "@/lib/goals.functions";
import { inr, moduleFee, productDaily, round2 } from "@/lib/savings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/recharge")({
  head: () => ({
    meta: [
      { title: "Mobile Recharge Saving – MBA" },
      { name: "description", content: "Pick your Jio, Airtel, Vi or BSNL plan and save a little every day for your next recharge." },
      { property: "og:title", content: "Mobile Recharge Saving – MBA" },
      { property: "og:description", content: "Save daily for your next Jio, Airtel, Vi or BSNL recharge." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RechargePage,
});

const OPERATORS = ["Jio", "Airtel", "Vi", "BSNL"];

// Server (createGoal) admin ka display_daily override maanta hai, isliye screen pe bhi wahi productDaily; warna dikhta kuch aur, katta kuch aur.
const dailyOf = (p: { price: number | string; duration_days: number; display_daily: number | string | null }) =>
  productDaily({ price: Number(p.price), duration_days: p.duration_days, display_daily: p.display_daily == null ? null : Number(p.display_daily) });

function RechargePage() {
  const { t } = useT();
  const { data = [] } = useQuery(productsQuery("recharge"));
  const { data: cfg } = useQuery(configQuery);
  const { data: me } = useQuery(meQuery);
  const live = data.filter((p) => p.enabled);
  const [op, setOp] = useState("Jio");
  const [days, setDays] = useState<number | null>(null);
  const [pid, setPid] = useState<string | null>(null);
  const [mobile, setMobile] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const create = useServerFn(createGoal);
  const nav = useNavigate();
  const opPlans = live.filter((p) => p.brand === op);
  const validities = [...new Set(opPlans.map((p) => p.duration_days))].sort((a, b) => a - b);
  const dur = days != null && validities.includes(days) ? days : validities[0];
  const plans = opPlans.filter((p) => p.duration_days === dur);
  const sel = plans.find((p) => p.id === pid);
  const num = mobile ?? me?.profile?.mobile_number ?? "";
  const checkedOn = cfg?.["recharge_checked_on"];
  const fee = moduleFee("recharge", cfg);

  const go = async () => {
    if (!sel || busy) return;
    setBusy(true);
    try { const g = await create({ data: { kind: "product", productId: sel.id, mobileNumber: num } }); nav({ to: "/goals/$goalId", params: { goalId: g.id }, search: { pay: true } }); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <AppShell title={t("recharge")} back>
      <p className="mb-2 text-sm font-semibold">1. SIM company</p>
      <div className="grid grid-cols-4 gap-2">
        {OPERATORS.map((o) => (
          <button key={o} onClick={() => { setOp(o); setDays(null); setPid(null); }}
            className={`rounded-xl border py-3 text-sm font-bold ${op === o ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{o}</button>
        ))}
      </div>
      <p className="mb-2 mt-5 text-sm font-semibold">2. Validity</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {validities.map((d) => (
          <button key={d} onClick={() => { setDays(d); setPid(null); }}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold ${dur === d ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{d} days</button>
        ))}
      </div>
      <p className="mb-2 mt-5 text-sm font-semibold">3. Plan</p>
      <div className="grid grid-cols-2 gap-2">
        {plans.map((p) => (
          <button key={p.id} onClick={() => setPid(p.id)} className={`rounded-2xl border p-3 text-left ${pid === p.id ? "border-primary ring-2 ring-primary" : "bg-card"}`}>
            <p className="text-lg font-extrabold">{inr(Number(p.price))}</p>
            <p className="text-xs font-semibold text-muted-foreground">{p.name}</p>
            <p className="mt-1 text-base font-extrabold text-accent">{inr(round2(dailyOf(p) + fee))}<span className="text-xs font-medium text-muted-foreground">{t("perDay")}</span></p>
          </button>
        ))}
        {!plans.length && <p className="col-span-2 py-6 text-center text-sm text-muted-foreground">No plans for {op} right now.</p>}
      </div>
      <p className="mb-2 mt-5 text-sm font-semibold">4. Mobile number</p>
      <Input inputMode="numeric" maxLength={10} placeholder="10-digit number" value={num} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))} />
      {sel && (
        <div className="mt-5 rounded-2xl bg-primary-soft p-4 text-sm">
          Pay <b>{inr(round2(dailyOf(sel) + fee))}</b> daily ({inr(dailyOf(sel))} saving + {inr(fee)} fee) for {sel.duration_days} days → <b>{inr(Number(sel.price))}</b> for your {op} {sel.name} recharge. When your saving is full, we recharge <b>{num || "your number"}</b> for you.
        </div>
      )}
      <Button disabled={!sel || busy} onClick={go} className="mt-4 h-12 w-full rounded-xl text-base font-bold">{t("startSaving")}</Button>
      {checkedOn && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Plans checked on {new Date(checkedOn).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}. Plans can differ by state; check before recharging.
        </p>
      )}
      <div className="mt-6 rounded-2xl border border-dashed border-gold bg-card p-4 text-sm">
        <p className="font-bold text-accent">🎁 Recharge offer</p>
        <p className="mt-1 text-muted-foreground">{cfg?.["offer_text"]}</p>
      </div>
    </AppShell>
  );
}
