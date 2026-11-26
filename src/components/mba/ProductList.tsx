import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Smartphone, Laptop, Bike, GraduationCap } from "lucide-react";
import { configQuery, productsQuery } from "./data";
import { createGoal } from "@/lib/goals.functions";
import { inr, moduleFee, productDaily, round2 } from "@/lib/savings";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

const icons = { android: Smartphone, iphone: Smartphone, laptop: Laptop, bike: Bike, college: GraduationCap } as Record<string, typeof Smartphone>;

export function ProductList({ module, filterable }: { module: string; filterable?: boolean }) {
  const { data = [], isLoading } = useQuery(productsQuery(module));
  const { data: cfg } = useQuery(configQuery);
  const checkedOn = cfg?.["prices_checked_on"];
  const [brand, setBrand] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const create = useServerFn(createGoal);
  const nav = useNavigate();
  const { t } = useT();
  const items = data.filter((p) => p.enabled && (!brand || p.brand === brand));
  const brands = [...new Set(data.map((p) => p.brand))];
  const Icon = icons[module] ?? Smartphone;

  const start = async (id: string) => {
    setBusy(id);
    try { const g = await create({ data: { kind: "product", productId: id } }); nav({ to: "/goals/$goalId", params: { goalId: g.id }, search: { pay: true } }); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(null); }
  };

  if (isLoading) return <p className="py-10 text-center text-muted-foreground">Loading…</p>;
  return (
    <div className="space-y-3">
      {filterable && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[null, ...brands].map((b) => (
            <button key={b ?? "all"} onClick={() => setBrand(b)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium ${brand === b ? "bg-primary text-primary-foreground border-primary" : "bg-card"}`}>{b ?? "All"}</button>
          ))}
        </div>
      )}
      {items.map((p) => {
        const daily = productDaily({ price: Number(p.price), duration_days: p.duration_days, display_daily: p.display_daily == null ? null : Number(p.display_daily) });
        const fee = moduleFee(module, cfg);
        return (
          <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-soft">
              {p.image_src ? <img src={p.image_src} alt={p.name} loading="lazy" className="h-full w-full object-cover" /> : <Icon className="h-8 w-8 text-primary" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">{p.brand}{p.variant ? ` · ${p.variant}` : ""}</p>
              <p className="font-bold leading-tight">{p.name}</p>
              <p className="text-xs text-muted-foreground">{module === "college" ? `${inr(Number(p.price))} in ${p.duration_days} days` : `${inr(Number(p.price))} · ${p.duration_days} days`}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold text-accent">{inr(round2(daily + fee))}<span className="text-xs font-medium text-muted-foreground">{t("perDay")}</span></p>
              {fee > 0 && <p className="text-[10px] text-muted-foreground">{inr(daily)} saving + {inr(fee)} fee</p>}
              <Button size="sm" disabled={busy !== null} onClick={() => start(p.id)} className="mt-1 rounded-full">{t("startSaving")}</Button>
            </div>
          </div>
        );
      })}
      {!items.length && <p className="py-10 text-center text-muted-foreground">No products available right now.</p>}
      {module !== "college" && checkedOn && (
        <p className="px-1 text-center text-xs text-muted-foreground">
          Prices checked on {new Date(checkedOn).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} from brand stores, Flipkart and Amazon. Shop prices can change.
        </p>
      )}
    </div>
  );
}
