import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { dailySaving, goalTotal, round2, validateCustomAmount } from "./savings";

type CreateGoalInput =
  | { kind: "product"; productId: string; mobileNumber?: string }
  | { kind: "custom"; name: string; target: string; daily: string };

export const createGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: CreateGoalInput) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let row: {
      module: string; product_id: string | null; goal_name: string; goal_amount: number;
      daily_saving: number; end_date: string; meta: Record<string, string>;
    };
    if (data.kind === "product") {
      const { data: p, error } = await supabase.from("products").select("*").eq("id", data.productId).eq("enabled", true).single();
      if (error || !p) throw new Error("Product not available");
      const meta: Record<string, string> = {};
      if (p.module === "recharge") {
        if (!/^[6-9]\d{9}$/.test(data.mobileNumber ?? "")) throw new Error("Enter a valid 10-digit mobile number");
        meta["mobile_number"] = data.mobileNumber!;
      }
      const priced = { price: Number(p.price), duration_days: p.duration_days, extra_per_day: Number(p.extra_per_day), display_daily: p.display_daily == null ? null : Number(p.display_daily) };
      const end = new Date(Date.now() + p.duration_days * 86400000).toISOString().slice(0, 10);
      row = {
        module: p.module, product_id: p.id,
        goal_name: p.module === "recharge" ? `${p.brand} · ${p.name} recharge` : `${p.name}${p.variant ? ` (${p.variant})` : ""}`,
        goal_amount: goalTotal(priced), daily_saving: dailySaving(priced), end_date: end, meta,
      };
    } else {
      const { data: cfg } = await supabase.from("app_config").select("key,value").in("key", ["custom_min", "custom_max"]);
      const min = Number(cfg?.find((c) => c.key === "custom_min")?.value ?? 10);
      const max = Number(cfg?.find((c) => c.key === "custom_max")?.value ?? 10000);
      const err = validateCustomAmount(data.daily, min, max);
      if (err) throw new Error(err);
      const target = Number(data.target);
      if (!Number.isFinite(target) || target < Number(data.daily) || target > 10000000) throw new Error("Enter a valid target amount");
      const name = data.name.trim().slice(0, 60) || "Custom Saving";
      const days = Math.ceil(target / Number(data.daily));
      row = {
        module: "custom", product_id: null, goal_name: name, goal_amount: round2(target),
        daily_saving: round2(Number(data.daily)), end_date: new Date(Date.now() + days * 86400000).toISOString().slice(0, 10), meta: {},
      };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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
    const amount = Math.min(Number(g.daily_saving), remaining);
    const orderId = "MBA" + Date.now() + Math.random().toString(36).slice(2, 8).toUpperCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("transactions").insert({ user_id: userId, goal_id: g.id, provider_order_id: orderId, amount });
    if (error) throw new Error("Could not create order");
    const { data: cfg } = await supabase.from("app_config").select("key,value").in("key", ["upi_id", "upi_name"]);
    const cfgId = cfg?.find((c) => c.key === "upi_id")?.value?.trim() ?? "";
    const payeeId = /^[\w.-]{2,256}@[a-zA-Z][\w.-]{1,64}$/.test(cfgId) ? cfgId : "mba.demo@upi";
    const payeeName = (cfg?.find((c) => c.key === "upi_name")?.value?.trim() || "MBA Savings").slice(0, 50);
    const query = new URLSearchParams({
      pa: payeeId, pn: payeeName, am: amount.toFixed(2), cu: "INR", tr: orderId, tn: `MBA ${g.goal_name}`.slice(0, 50),
    }).toString().replace(/\+/g, "%20");
    return { orderId, amount, query, upi: `upi://pay?${query}`, payeeId, payeeName, demo: payeeId === "mba.demo@upi" };
  });
