import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/mba/AppShell";
import { configQuery } from "@/components/mba/data";
import { createGoal } from "@/lib/goals.functions";
import { validateCustomAmount, inr } from "@/lib/savings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/custom")({
  head: () => ({ meta: [{ title: "Custom Saving – MBA" }, { name: "description", content: "Pick your own daily amount and pay by UPI QR." }] }),
  component: CustomPage,
});

function CustomPage() {
  const { t } = useT();
  const { data: cfg } = useQuery(configQuery);
  const min = Number(cfg?.["custom_min"] ?? 10), max = Number(cfg?.["custom_max"] ?? 10000);
  const [name, setName] = useState("");
  const [daily, setDaily] = useState("50");
  const [target, setTarget] = useState("5000");
  const create = useServerFn(createGoal);
  const nav = useNavigate();
  const err = validateCustomAmount(daily, min, max);
  const go = async () => {
    try { const g = await create({ data: { kind: "custom", name, target, daily } }); nav({ to: "/goals/$goalId", params: { goalId: g.id }, search: { pay: true } }); }
    catch (e) { toast.error((e as Error).message); }
  };
  return (
    <AppShell title={t("custom")} back>
      <div className="space-y-4 rounded-3xl bg-card p-5 shadow-card">
        <div className="space-y-1"><Label>Goal name</Label><Input placeholder="e.g. Trip to Goa" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-1"><Label>Target amount (₹)</Label><Input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} /></div>
        <div className="space-y-2">
          <Label>Daily amount</Label>
          <div className="grid grid-cols-4 gap-2">
            {[10, 50, 100, 500].map((a) => (
              <button key={a} onClick={() => setDaily(String(a))} className={`rounded-xl border py-2 font-bold ${daily === String(a) ? "border-primary bg-primary text-primary-foreground" : ""}`}>₹{a}</button>
            ))}
          </div>
          <Input inputMode="decimal" value={daily} onChange={(e) => setDaily(e.target.value)} />
          <p className={`text-xs ${err ? "text-destructive" : "text-muted-foreground"}`}>{err ?? `Allowed ${inr(min)} – ${inr(max)}`}</p>
        </div>
        <Button disabled={!!err} onClick={go} className="h-12 w-full rounded-xl text-base font-bold">Generate QR</Button>
      </div>
    </AppShell>
  );
}
