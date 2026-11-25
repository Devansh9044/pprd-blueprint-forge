import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { FEE_KEYS, moduleFee, paymentFor, productDaily, round2, validateCustomAmount } from "./savings";

// App ka din IST (UTC+5:30) me chalta hai (streak bhi IST me hai), isliye goal ki dates bhi IST se.
const istDate = (addDays = 0) => new Date(Date.now() + 19800000 + addDays * 86400000).toISOString().slice(0, 10);

type CreateGoalInput =
  | { kind: "product"; productId: string; mobileNumber?: string }
  | { kind: "custom"; name: string; target: string; daily: string };

export const createGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: CreateGoalInput) => {
    // Client se aaya data trust nahi karte: type/shape yahin check hota hai.
    if (d?.kind === "product") {
      if (typeof d.productId !== "string" || !d.productId) throw new Error("Product not available");
      if (d.mobileNumber != null && typeof d.mobileNumber !== "string") throw new Error("Enter a valid 10-digit mobile number");
      return d;
    }
    if (d?.kind === "custom" && typeof d.name === "string" && typeof d.target === "string" && typeof d.daily === "string") return d;
    throw new Error("Invalid request");
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let row: {
      module: string; product_id: string | null; goal_name: string; goal_amount: number;
      daily_saving: number; fee_per_day: number; start_date: string; end_date: string; meta: Record<string, string>;
    };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Owner's extra charge per module is admin config; read it server-side so the client can't change it.
    const { data: feeCfg } = await supabaseAdmin.from("app_config").select("key,value").in("key", [...new Set(Object.values(FEE_KEYS))]);
    const fees = Object.fromEntries((feeCfg ?? []).map((c) => [c.key, c.value]));
    if (data.kind === "product") {
      const { data: p, error } = await supabase.from("products").select("*").eq("id", data.productId).eq("enabled", true).single();
      if (error || !p) throw new Error("Product not available");
      const meta: Record<string, string> = {};
      if (p.module === "recharge") {
        if (!/^[6-9]\d{9}$/.test(data.mobileNumber ?? "")) throw new Error("Enter a valid 10-digit mobile number");
        meta["mobile_number"] = data.mobileNumber!;
        meta["operator"] = p.brand;
        meta["plan"] = `${p.variant ?? ""} · ${p.name} · ${p.duration_days} days`;
      }
      const priced = { price: Number(p.price), duration_days: p.duration_days, display_daily: p.display_daily == null ? null : Number(p.display_daily) };
      const end = istDate(p.duration_days);
      row = {
        module: p.module, product_id: p.id,
        goal_name: p.module === "recharge" ? `${p.brand} ${p.variant ?? ""} recharge · ${p.name} · ${p.duration_days} days` : `${p.name}${p.variant ? ` (${p.variant})` : ""}`,
        // Save exactly the price; daily is price ÷ days rounded up (last payment is capped at what's left).
        goal_amount: round2(Number(p.price)),
        daily_saving: productDaily(priced),
        fee_per_day: moduleFee(p.module, fees),
        start_date: istDate(), end_date: end, meta,
      };
    } else {
      const { data: cfg } = await supabase.from("app_config").select("key,value").in("key", ["custom_min", "custom_max"]);
      // Admin ne galti se "abc" ya khali daal diya to limit gayab na ho: NaN pe default pe wapas.
      const rawMin = Number(cfg?.find((c) => c.key === "custom_min")?.value ?? 10);
      const rawMax = Number(cfg?.find((c) => c.key === "custom_max")?.value ?? 10000);
      const min = Number.isFinite(rawMin) && rawMin > 0 ? rawMin : 10;
      const max = Number.isFinite(rawMax) && rawMax >= min ? rawMax : 10000;
      const err = validateCustomAmount(data.daily, min, max);
      if (err) throw new Error(err);
      const target = Number(data.target);
      if (!Number.isFinite(target) || target < Number(data.daily) || target > 10000000) throw new Error("Enter a valid target amount");
      const name = data.name.trim().slice(0, 60) || "Custom Saving";
      const days = Math.ceil(target / Number(data.daily));
      row = {
        module: "custom", product_id: null, goal_name: name, goal_amount: round2(target),
        daily_saving: round2(Number(data.daily)), fee_per_day: moduleFee("custom", fees), start_date: istDate(), end_date: istDate(days), meta: {},
      };
    }
    const { data: g, error } = await supabaseAdmin.from("saving_goals").insert({ ...row, user_id: userId }).select("id").single();
    if (error) throw new Error("Could not create goal");
    return { id: g.id };
  });

export const createDemoOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { goalId: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: g } = await supabase.from("saving_goals").select("*").eq("id", data.goalId).eq("user_id", userId).single();
    if (!g) throw new Error("Goal not found");
    if (g.status !== "active") throw new Error("This goal is not active");
    const remaining = round2(Number(g.goal_amount) - Number(g.saved_amount));
    // Member pays the saving part + the owner's fee; only the saving part is credited to the goal.
    const { amount, fee, saving } = paymentFor(Number(g.daily_saving), Number(g.fee_per_day ?? 0), remaining);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Dialog baar-baar kholne pe naya order nahi banta: wahi pending (15 min ke andar) order dobara use hota hai.
    const { data: open } = await supabaseAdmin.from("transactions").select("provider_order_id")
      .eq("goal_id", g.id).eq("user_id", userId).eq("payment_status", "pending").eq("amount", amount)
      .gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(1).maybeSingle();
    const orderId = open?.provider_order_id ?? "MBA" + Date.now() + Math.random().toString(36).slice(2, 8).toUpperCase();
    if (!open) {
      const { error } = await supabaseAdmin.from("transactions").insert({ user_id: userId, goal_id: g.id, provider_order_id: orderId, amount, fee });
      if (error) throw new Error("Could not create order");
    }
    // Payee details are admin/server-only config, so read them with the server client.
    const { data: cfg } = await supabaseAdmin.from("app_config").select("key,value").in("key", ["upi_id", "upi_name"]);
    const cfgId = cfg?.find((c) => c.key === "upi_id")?.value?.trim() ?? "";
    const payeeId = /^[\w.-]{2,256}@[a-zA-Z][\w.-]{1,64}$/.test(cfgId) ? cfgId : "mba.demo@upi";
    const payeeName = (cfg?.find((c) => c.key === "upi_name")?.value?.trim() || "MBA Savings").slice(0, 50);
    const query = new URLSearchParams({
      pa: payeeId, pn: payeeName, am: amount.toFixed(2), cu: "INR", tr: orderId, tn: `MBA ${g.goal_name}`.slice(0, 50),
    }).toString().replace(/\+/g, "%20");
    return { orderId, amount, fee, saving, query, upi: `upi://pay?${query}`, payeeId, payeeName, demo: payeeId === "mba.demo@upi" };
  });
