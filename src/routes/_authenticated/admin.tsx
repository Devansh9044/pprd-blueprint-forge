import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/mba/AppShell";
import { configQuery, meQuery, withImageSrc, STORAGE_PREFIX, PAYMENT_STATUS } from "@/components/mba/data";
import { ImagePlus, Smartphone } from "lucide-react";
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
  const { data = [] } = useQuery({ queryKey: ["admin-products", mod], queryFn: async () => withImageSrc((await supabase.from("products").select("*").eq("module", mod).order("sort")).data ?? []) });
  const [uploading, setUploading] = useState<string | null>(null);
  const upload = async (id: string, file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Choose a photo file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Photo must be under 5 MB"); return; }
    setUploading(id);
    const path = `${id}/${Date.now()}.${(file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type });
    setUploading(null);
    if (error) { toast.error(error.message); return; }
    await upd(id, { image_url: STORAGE_PREFIX + path });
  };
  const upd = async (id: string, patch: Record<string, unknown>) => {
    const { error } = await supabase.from("products").update(patch as never).eq("id", id);
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
            <label className="relative flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-primary-soft" title="Upload photo">
              {p.image_src ? <img src={p.image_src} alt={p.name} className="h-full w-full object-cover" /> : <Smartphone className="h-6 w-6 text-primary" />}
              <span className="absolute bottom-0 right-0 rounded-tl-lg bg-primary p-0.5 text-primary-foreground"><ImagePlus className="h-3.5 w-3.5" /></span>
              <input type="file" accept="image/*" className="sr-only" disabled={uploading === p.id} onChange={(e) => upload(p.id, e.target.files?.[0])} />
            </label>
            <Input defaultValue={p.name} onBlur={(e) => e.target.value !== p.name && upd(p.id, { name: e.target.value })} />
            <Switch checked={p.enabled} onCheckedChange={(v) => upd(p.id, { enabled: v })} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {([["brand", "Brand"], ["variant", "Variant"], ["price", "Price ₹"], ["extra_per_day", "Extra ₹/day"], ["duration_days", "Days"], ["display_daily", "Display ₹/day (opt)"], ["image_url", "Photo link (or tap the photo to upload)"]] as const).map(([k, l]) => (
              <label key={k} className={k === "image_url" ? "col-span-2" : ""}>{l}
                <Input key={String(p[k] ?? "")} defaultValue={(p[k] as string | number | null) ?? ""} onBlur={(e) => {
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
      <label className="block">Custom saving minimum ₹<Input defaultValue={data["custom_min"]} onBlur={(e) => save("custom_min", e.target.value)} /></label>
      <label className="block">Custom saving maximum ₹<Input defaultValue={data["custom_max"]} onBlur={(e) => save("custom_max", e.target.value)} /></label>
      <p className="rounded-xl bg-primary-soft p-2 text-xs">{/^[\w.-]{2,256}@[a-zA-Z][\w.-]{1,64}$/.test(data["upi_id"] ?? "") && data["upi_id"] !== "mba.demo@upi" ? "Real payments are ON. Members pay to the UPI ID below and enter their UPI reference; approve each one in Payments after you see the money in your account." : "Demo mode. Enter your real UPI ID below to start taking real money."}</p>
      <label className="block">Receiving UPI ID (money comes here)<Input placeholder="yourname@ybl" defaultValue={data["upi_id"]} onBlur={(e) => e.target.value !== (data["upi_id"] ?? "") && save("upi_id", e.target.value.trim())} /></label>
      <label className="block">Name shown in UPI apps<Input placeholder="MBA Savings" defaultValue={data["upi_name"]} onBlur={(e) => e.target.value !== (data["upi_name"] ?? "") && save("upi_name", e.target.value.trim())} /></label>
      <label className="block">Product prices last checked on<Input type="date" defaultValue={data["prices_checked_on"]} onBlur={(e) => e.target.value && e.target.value !== (data["prices_checked_on"] ?? "") && save("prices_checked_on", e.target.value)} /></label>
      <label className="block">Recharge offer text<Textarea rows={5} defaultValue={data["offer_text"]} onBlur={(e) => save("offer_text", e.target.value)} /></label>
    </div>
  );
}

function Users() {
  const { data = [] } = useQuery({ queryKey: ["admin-users"], queryFn: async () => (await supabase.from("profiles").select("*").order("created_at", { ascending: false })).data ?? [] });
  return <div className="space-y-2">{data.map((u) => <div key={u.id} className="rounded-xl bg-card p-3 text-sm shadow-card"><b>{u.full_name || "—"}</b> · {u.mobile_number || "—"}<p className="text-xs text-muted-foreground">Joined {new Date(u.created_at).toLocaleDateString("en-IN")}</p></div>)}</div>;
}

function Tx() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"submitted" | "all">("submitted");
  const [busy, setBusy] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["admin-tx", filter],
    queryFn: async () => {
      let q = supabase.from("transactions").select("*, saving_goals(goal_name)").order("created_at", { ascending: false }).limit(200);
      if (filter === "submitted") q = q.eq("payment_status", "submitted");
      const tx = (await q).data ?? [];
      const ids = [...new Set(tx.map((x) => x.user_id))];
      const { data: people } = ids.length ? await supabase.from("profiles").select("id, full_name, mobile_number").in("id", ids) : { data: [] };
      const byId = new Map((people ?? []).map((p) => [p.id, p]));
      return tx.map((x) => ({ ...x, person: byId.get(x.user_id) }));
    },
  });
  const review = async (id: string, approve: boolean) => {
    setBusy(id);
    const { error } = await supabase.rpc("admin_review_payment", { _tx_id: id, _approve: approve });
    setBusy(null);
    if (error) toast.error(error.message); else { toast.success(approve ? "Approved — added to the goal" : "Rejected"); qc.invalidateQueries(); }
  };
  const list = data ?? [];
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 rounded-2xl bg-card p-1 text-xs font-bold shadow-card">
        {([["submitted", "To check"], ["all", "All payments"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`rounded-xl py-2 ${filter === k ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>{l}</button>
        ))}
      </div>
      {filter === "submitted" && <p className="text-xs text-muted-foreground">Open your bank or UPI app, find a payment with the same UTR and amount, then approve it. Reject it if you can't find it.</p>}
      {list.map((x) => (
        <div key={x.id} className="space-y-2 rounded-xl bg-card p-3 text-sm shadow-card">
          <div className="flex justify-between gap-2">
            <span className="min-w-0"><b>{x.person?.full_name || "—"}</b> <span className="text-xs text-muted-foreground">{x.person?.mobile_number}</span><br /><span className="text-xs text-muted-foreground">{x.saving_goals?.goal_name} · {new Date(x.submitted_at ?? x.created_at).toLocaleString("en-IN")}</span></span>
            <span className="text-right"><b>{inr(Number(x.amount))}</b><br /><span className="text-xs">{PAYMENT_STATUS[x.payment_status] ?? x.payment_status}</span></span>
          </div>
          <p className="text-xs">UTR <b className="font-mono">{x.utr ?? "—"}</b> · <span className="text-muted-foreground">{x.provider_order_id}</span></p>
          {x.payment_status === "submitted" && (
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 bg-success text-primary-foreground hover:bg-success/90" disabled={busy === x.id} onClick={() => review(x.id, true)}>Money received · Approve</Button>
              <Button size="sm" variant="outline" className="flex-1" disabled={busy === x.id} onClick={() => review(x.id, false)}>Reject</Button>
            </div>
          )}
        </div>
      ))}
      {!list.length && <p className="py-10 text-center text-muted-foreground">{filter === "submitted" ? "No payments waiting to be checked." : "No payments yet."}</p>}
    </div>
  );
}
