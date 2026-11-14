import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/mba/AppShell";
import { configQuery, meQuery } from "@/components/mba/data";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { inr } from "@/lib/savings";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin – MBA" }, { name: "description", content: "Manage products, prices and offers." }] }),
  component: AdminPage,
});

const MODULES = ["recharge", "android", "iphone", "laptop", "bike", "college"];

function AdminPage() {
  const { data: me } = useQuery(meQuery);
  const [tab, setTab] = useState<"products" | "config" | "users" | "tx">("products");
  if (me && !me.isAdmin) return <AppShell title="Admin"><p className="py-10 text-center text-muted-foreground">Admins only.</p></AppShell>;
  return (
    <AppShell title="Admin">
      <div className="mb-4 grid grid-cols-4 rounded-2xl bg-card p-1 text-xs shadow-card">
        {(["products", "config", "users", "tx"] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-xl py-2 font-bold capitalize ${tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{k === "tx" ? "Payments" : k}</button>
        ))}
      </div>
      {tab === "products" && <Products />}
      {tab === "config" && <Config />}
      {tab === "users" && <Users />}
      {tab === "tx" && <Tx />}
    </AppShell>
  );
}

function Products() {
  const [mod, setMod] = useState("android");
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin-products", mod], queryFn: async () => (await supabase.from("products").select("*").eq("module", mod).order("sort")).data ?? [] });
  const upd = async (id: string, patch: Record<string, unknown>) => {
    const { error } = await supabase.from("products").update(patch).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Updated"); qc.invalidateQueries(); }
  };
  const add = async () => {
    const { error } = await supabase.from("products").insert({ module: mod, brand: "New brand", name: "New model", price: 50000, extra_per_day: mod === "bike" ? 0 : 1, duration_days: 365, sort: 99 });
    if (error) toast.error(error.message); else qc.invalidateQueries();
  };
  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto">{MODULES.map((m) => <button key={m} onClick={() => setMod(m)} className={`rounded-full border px-3 py-1 text-sm capitalize ${mod === m ? "bg-primary text-primary-foreground" : "bg-card"}`}>{m}</button>)}</div>
      {data.map((p) => (
        <div key={p.id} className="space-y-2 rounded-2xl bg-card p-3 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <Input defaultValue={p.name} onBlur={(e) => e.target.value !== p.name && upd(p.id, { name: e.target.value })} />
            <Switch checked={p.enabled} onCheckedChange={(v) => upd(p.id, { enabled: v })} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {([["brand", "Brand"], ["variant", "Variant"], ["price", "Price ₹"], ["extra_per_day", "Extra ₹/day"], ["duration_days", "Days"], ["display_daily", "Display ₹/day (opt)"], ["image_url", "Image URL"]] as const).map(([k, l]) => (
              <label key={k} className={k === "image_url" ? "col-span-2" : ""}>{l}
                <Input defaultValue={(p[k] as string | number | null) ?? ""} onBlur={(e) => {
                  const v = e.target.value; const num = ["price", "extra_per_day", "duration_days", "display_daily"].includes(k);
                  const val = v === "" ? null : num ? Number(v) : v;
                  if (String(val ?? "") !== String(p[k] ?? "")) upd(p.id, { [k]: val });
                }} />
              </label>
            ))}
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={add} className="w-full">+ Add product</Button>
    </div>
  );
}

function Config() {
  const { data } = useQuery(configQuery);
  const qc = useQueryClient();
  const save = async (key: string, value: string) => {
    const { error } = await supabase.from("app_config").upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) toast.error(error.message); else { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["config"] }); }
  };
  if (!data) return null;
  return (
    <div className="space-y-3 rounded-2xl bg-card p-4 shadow-card text-sm">
      <label className="block">Custom saving minimum ₹<Input defaultValue={data.custom_min} onBlur={(e) => save("custom_min", e.target.value)} /></label>
      <label className="block">Custom saving maximum ₹<Input defaultValue={data.custom_max} onBlur={(e) => save("custom_max", e.target.value)} /></label>
      <label className="block">Recharge offer text<Textarea rows={5} defaultValue={data.offer_text} onBlur={(e) => save("offer_text", e.target.value)} /></label>
    </div>
  );
}

function Users() {
  const { data = [] } = useQuery({ queryKey: ["admin-users"], queryFn: async () => (await supabase.from("profiles").select("*").order("created_at", { ascending: false })).data ?? [] });
  return <div className="space-y-2">{data.map((u) => <div key={u.id} className="rounded-xl bg-card p-3 text-sm shadow-card"><b>{u.full_name || "—"}</b> · {u.mobile_number || "—"}<p className="text-xs text-muted-foreground">Joined {new Date(u.created_at).toLocaleDateString("en-IN")}</p></div>)}</div>;
}

function Tx() {
  const { data = [] } = useQuery({ queryKey: ["admin-tx"], queryFn: async () => (await supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(200)).data ?? [] });
  return <div className="space-y-2">{data.map((x) => <div key={x.id} className="flex justify-between rounded-xl bg-card p-3 text-sm shadow-card"><span className="truncate">{x.provider_order_id}<br /><span className="text-xs text-muted-foreground">{new Date(x.created_at).toLocaleString("en-IN")}</span></span><span className="text-right"><b>{inr(Number(x.amount))}</b><br /><span className="text-xs">{x.payment_status}</span></span></div>)}</div>;
}
