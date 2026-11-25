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
import { inr, DEFAULT_FEES } from "@/lib/savings";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin – MBA" }, { name: "description", content: "Manage products, prices and offers." }] }),
  component: AdminPage,
});

const MODULES = ["recharge", "android", "iphone", "laptop", "bike", "college"];
const FEE_FIELDS = [["fee_recharge", "Mobile Recharge"], ["fee_mobile", "Mobile"], ["fee_laptop", "Laptop"], ["fee_bike", "Bike"], ["fee_college", "College"], ["fee_custom", "Custom"]] as const;

function AdminPage() {
  const { data: me } = useQuery(meQuery);
  const [tab, setTab] = useState<"products" | "config" | "users" | "tx" | "recharge">("products");
  if (!me) return <AppShell title="Admin"><p className="py-10 text-center text-muted-foreground">…</p></AppShell>;
  if (!me.isAdmin) return <AppShell title="Admin"><p className="py-10 text-center text-muted-foreground">Admins only.</p></AppShell>;
  return (
    <AppShell title="Admin">
      <div className="mb-4 grid grid-cols-5 rounded-2xl bg-card p-1 text-[11px] shadow-card">
        {(["products", "config", "users", "tx", "recharge"] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-xl py-2 font-bold capitalize ${tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{k === "tx" ? "Payments" : k}</button>
        ))}
      </div>
      {tab === "products" && <Products />}
      {tab === "config" && <Config />}
      {tab === "users" && <Users />}
      {tab === "tx" && <Tx />}
      {tab === "recharge" && <Recharges />}
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
    const { error } = await supabase.from("products").insert({ module: mod, brand: "New brand", name: "New model", price: 50000, duration_days: 365, sort: 99 });
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
            <Input defaultValue={p.name} onBlur={(e) => {
              if (e.target.value === p.name) return;
              if (!e.target.value.trim()) { toast.error("Name cannot be empty"); e.target.value = p.name; return; }
              upd(p.id, { name: e.target.value });
            }} />
            <Switch checked={p.enabled} onCheckedChange={(v) => upd(p.id, { enabled: v })} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {([["brand", "Brand"], ["variant", "Variant"], ["price", "Price ₹"], ["duration_days", "Days"], ["display_daily", "Display ₹/day (opt)"], ["image_url", "Photo link (or tap the photo to upload)"]] as const).map(([k, l]) => (
              <label key={k} className={k === "image_url" ? "col-span-2" : ""}>{l}
                <Input key={String(p[k] ?? "")} defaultValue={(p[k] as string | number | null) ?? ""} onBlur={(e) => {
                  const v = e.target.value; const num = ["price", "duration_days", "display_daily"].includes(k);
                  const val = v === "" ? null : num ? Number(v) : v;
                  if (num && (val === null ? k !== "display_daily" : (typeof val === "number" && (!Number.isFinite(val) || val <= 0 || (k === "duration_days" && !Number.isInteger(val)))))) { toast.error("Enter a valid positive number"); e.target.value = String(p[k] ?? ""); return; }
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
  // Min/max galat (abc, 0, min>max) ho to customer ki limit toot jaati hai, isliye save se pehle check.
  const saveLimit = (key: "custom_min" | "custom_max", raw: string) => {
    const v = raw.trim();
    if (v === (data[key] ?? "")) return;
    if (!/^\d+(\.\d{1,2})?$/.test(v) || Number(v) <= 0) { toast.error("Enter a valid amount like 10"); return; }
    const other = Number(data[key === "custom_min" ? "custom_max" : "custom_min"]);
    if (Number.isFinite(other) && (key === "custom_min" ? Number(v) > other : Number(v) < other)) { toast.error("Minimum cannot be more than maximum"); return; }
    save(key, v);
  };
  return (
    <div className="space-y-3 rounded-2xl bg-card p-4 shadow-card text-sm">
      <div className="space-y-2 rounded-xl border p-3">
        <p className="font-bold text-accent">Extra charge per daily payment (your profit)</p>
        <p className="text-xs text-muted-foreground">Members pay this on top of their daily saving. It is not added to their goal. Changes apply to new goals only.</p>
        <div className="grid grid-cols-2 gap-2">
          {FEE_FIELDS.map(([key, label]) => (
            <label key={key} className="block text-xs">{label} ₹<Input inputMode="decimal" defaultValue={data[key] ?? String(DEFAULT_FEES[key])} onBlur={(e) => {
              const v = e.target.value.trim();
              if (!/^\d{1,2}(\.\d{1,2})?$/.test(v)) { toast.error("Enter an amount like 0.90"); return; }
              if (v !== (data[key] ?? "")) save(key, v);
            }} /></label>
          ))}
        </div>
      </div>
      <label className="block">Custom saving minimum ₹<Input defaultValue={data["custom_min"]} onBlur={(e) => saveLimit("custom_min", e.target.value)} /></label>
      <label className="block">Custom saving maximum ₹<Input defaultValue={data["custom_max"]} onBlur={(e) => saveLimit("custom_max", e.target.value)} /></label>
      <p className="rounded-xl bg-primary-soft p-2 text-xs">{/^[\w.-]{2,256}@[a-zA-Z][\w.-]{1,64}$/.test(data["upi_id"] ?? "") && data["upi_id"] !== "mba.demo@upi" ? "Real payments are ON. Members pay to the UPI ID below and enter their UPI reference; approve each one in Payments after you see the money in your account." : "Demo mode. Enter your real UPI ID below to start taking real money."}</p>
      <label className="block">Receiving UPI ID (money comes here)<Input placeholder="yourname@ybl" defaultValue={data["upi_id"]} onBlur={(e) => e.target.value !== (data["upi_id"] ?? "") && save("upi_id", e.target.value.trim())} /></label>
      <label className="block">Name shown in UPI apps<Input placeholder="MBA Savings" defaultValue={data["upi_name"]} onBlur={(e) => e.target.value !== (data["upi_name"] ?? "") && save("upi_name", e.target.value.trim())} /></label>
      <label className="block">Product prices last checked on<Input type="date" defaultValue={data["prices_checked_on"]} onBlur={(e) => e.target.value && e.target.value !== (data["prices_checked_on"] ?? "") && save("prices_checked_on", e.target.value)} /></label>
      <label className="block">Recharge plans last checked on<Input type="date" defaultValue={data["recharge_checked_on"]} onBlur={(e) => e.target.value && e.target.value !== (data["recharge_checked_on"] ?? "") && save("recharge_checked_on", e.target.value)} /></label>
      <label className="block">Recharge offer text<Textarea rows={5} defaultValue={data["offer_text"]} onBlur={(e) => e.target.value !== (data["offer_text"] ?? "") && save("offer_text", e.target.value)} /></label>
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
    // Approve/Reject dono wapas nahi hote (rejected UTR member dobara use nahi kar sakta), isliye pehle puchho.
    if (!window.confirm(approve ? "Approve this payment? Do this only after the money is in your account. It cannot be undone." : "Reject this payment? The member cannot use this UTR again. It cannot be undone.")) return;
    setBusy(id);
    const { error } = await supabase.rpc("admin_review_payment", { _tx_id: id, _approve: approve });
    setBusy(null);
    if (error) toast.error(error.message); else { toast.success(approve ? "Approved — added to the goal" : "Rejected"); qc.invalidateQueries(); }
  };
  const list = data ?? [];
  const { data: profit } = useQuery({ queryKey: ["admin-profit"], queryFn: async () => {
    const { data, error } = await supabase.rpc("admin_profit_summary");
    if (error) throw error; return data as { today: number; month: number; total: number; payments: number };
  } });
  return (
    <div className="space-y-2">
      {profit && (
        <div className="rounded-2xl bg-hero p-4 text-primary-foreground">
          <p className="text-xs opacity-80">Your profit from extra charges (confirmed payments)</p>
          <div className="mt-1 grid grid-cols-3 gap-2 text-center">
            {([["Today", profit.today], ["This month", profit.month], ["All time", profit.total]] as const).map(([l, v]) => (
              <div key={l}><p className="text-lg font-extrabold">{inr(Number(v))}</p><p className="text-[11px] opacity-80">{l}</p></div>
            ))}
          </div>
        </div>
      )}
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
            <span className="text-right"><b>{inr(Number(x.amount))}</b>{Number(x.fee) > 0 && <span className="block text-[11px] text-success">profit {inr(Number(x.fee))}</span>}<span className="text-xs">{PAYMENT_STATUS[x.payment_status] ?? x.payment_status}</span></span>
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

function Recharges() {
  const qc = useQueryClient();
  const [show, setShow] = useState<"todo" | "done">("todo");
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["admin-recharges", show],
    queryFn: async () => {
      let q = supabase.from("saving_goals").select("*").eq("module", "recharge").eq("status", "completed").order("created_at", { ascending: true }).limit(200);
      q = show === "todo" ? q.is("fulfilled_at", null) : q.not("fulfilled_at", "is", null);
      const goals = (await q).data ?? [];
      const ids = [...new Set(goals.map((g) => g.user_id))];
      const { data: people } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };
      const byId = new Map((people ?? []).map((p) => [p.id, p]));
      return goals.map((g) => ({ ...g, person: byId.get(g.user_id), m: (g.meta ?? {}) as Record<string, string> }));
    },
  });
  const done = async (id: string) => {
    setBusy(id);
    const { error } = await supabase.rpc("admin_mark_fulfilled", { _goal_id: id, _ref: refs[id] ?? "" });
    setBusy(null);
    if (error) toast.error(error.message); else { toast.success("Marked as recharged"); qc.invalidateQueries(); }
  };
  const list = data ?? [];
  const { data: profit } = useQuery({ queryKey: ["admin-profit"], queryFn: async () => {
    const { data, error } = await supabase.rpc("admin_profit_summary");
    if (error) throw error; return data as { today: number; month: number; total: number; payments: number };
  } });
  return (
    <div className="space-y-2">
      {profit && (
        <div className="rounded-2xl bg-hero p-4 text-primary-foreground">
          <p className="text-xs opacity-80">Your profit from extra charges (confirmed payments)</p>
          <div className="mt-1 grid grid-cols-3 gap-2 text-center">
            {([["Today", profit.today], ["This month", profit.month], ["All time", profit.total]] as const).map(([l, v]) => (
              <div key={l}><p className="text-lg font-extrabold">{inr(Number(v))}</p><p className="text-[11px] opacity-80">{l}</p></div>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 rounded-2xl bg-card p-1 text-xs font-bold shadow-card">
        {([["todo", "To recharge"], ["done", "Done"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setShow(k)} className={`rounded-xl py-2 ${show === k ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>{l}</button>
        ))}
      </div>
      {show === "todo" && <p className="text-xs text-muted-foreground">These members have saved the full plan amount. Recharge the number from your own Jio / Airtel / Vi / BSNL or UPI app, then type the recharge reference number and tap Done.</p>}
      {list.map((g) => (
        <div key={g.id} className="space-y-2 rounded-xl bg-card p-3 text-sm shadow-card">
          <div className="flex justify-between gap-2">
            <span className="min-w-0"><b>{g.person?.full_name || "—"}</b><br /><span className="text-xs text-muted-foreground">{g.goal_name}</span></span>
            <span className="text-right"><b>{inr(Number(g.saved_amount))}</b><br /><span className="text-xs text-muted-foreground">saved</span></span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-primary-soft px-3 py-2">
            <span><span className="text-xs text-muted-foreground">{g.m["operator"] ?? "SIM"} number</span><br /><b className="font-mono text-base">{g.m["mobile_number"] ?? "—"}</b></span>
            {g.m["mobile_number"] && <Button size="sm" variant="outline" onClick={() => { navigator.clipboard?.writeText(g.m["mobile_number"]!); toast.success("Number copied"); }}>Copy</Button>}
          </div>
          {show === "todo" ? (
            <div className="flex gap-2">
              <Input placeholder="Recharge reference no." value={refs[g.id] ?? ""} onChange={(e) => setRefs((r) => ({ ...r, [g.id]: e.target.value }))} />
              <Button size="sm" className="shrink-0" disabled={busy === g.id || (refs[g.id] ?? "").trim().length < 4} onClick={() => done(g.id)}>Done</Button>
            </div>
          ) : (
            <p className="text-xs">Recharged {g.fulfilled_at ? new Date(g.fulfilled_at).toLocaleString("en-IN") : ""} · Ref <b className="font-mono">{g.fulfilled_ref}</b></p>
          )}
        </div>
      ))}
      {!list.length && <p className="py-10 text-center text-muted-foreground">{show === "todo" ? "No recharges waiting." : "No recharges done yet."}</p>}
    </div>
  );
        }
