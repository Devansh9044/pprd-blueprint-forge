import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LEGAL } from "./legal";

// Play Store rule: user app ke andar se apna account + data delete kar sake.
// Paisa jis goal me phansa ho (ya payment check hona baaki ho) use pehle settle karna padega, warna delete nahi hoga.
// Payment ka record (amount, date, order no., UTR) hisaab-kitab ke liye bacha rehta hai, par profile se alag (anonymous).
export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const contact = `Please email ${LEGAL.supportEmail} so we can settle it first.`;

    // Admin account yahan se delete nahi hota (galti se owner ka access na chala jaye).
    const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
    if ((roles ?? []).some((r) => r.role === "admin")) throw new Error("Admin accounts cannot be deleted here.");

    // 1) Paisa phansa ho to rok do.
    const { data: waiting } = await supabaseAdmin.from("transactions").select("id").eq("user_id", userId).eq("payment_status", "submitted").limit(1);
    if (waiting?.length) throw new Error(`One of your payments is still being checked. ${contact}`);
    const { data: goals, error: gErr } = await supabaseAdmin.from("saving_goals").select("id, module, status, saved_amount, fulfilled_at").eq("user_id", userId);
    if (gErr) throw new Error("Could not check your goals. Please try again.");
    const holdsMoney = (goals ?? []).some((g) =>
      (["active", "paused"].includes(g.status) && Number(g.saved_amount) > 0) ||
      (g.module === "recharge" && g.status === "completed" && !g.fulfilled_at));
    if (holdsMoney) throw new Error(`You still have saved money in a goal. ${contact}`);

    // 2) Bina paise wale goals poore hata do (unke adhoore payments bhi saath hat jate hain).
    const { error: dErr } = await supabaseAdmin.from("saving_goals").delete().eq("user_id", userId).eq("saved_amount", 0);
    if (dErr) throw new Error("Could not delete your data. Please try again.");
    // 3) Jo goals paise ke record ki wajah se bache hain unse personal details (mobile number, custom naam) hata do.
    const { error: mErr } = await supabaseAdmin.from("saving_goals").update({ meta: {} }).eq("user_id", userId);
    if (mErr) throw new Error("Could not delete your data. Please try again.");
    const { error: nErr } = await supabaseAdmin.from("saving_goals").update({ goal_name: "Custom goal" }).eq("user_id", userId).eq("module", "custom");
    if (nErr) throw new Error("Could not delete your data. Please try again.");
    // 4) Streak aur rewards.
    const { error: sErr } = await supabaseAdmin.from("streaks").delete().eq("user_id", userId);
    const { error: rErr } = await supabaseAdmin.from("rewards").delete().eq("user_id", userId);
    if (sErr || rErr) throw new Error("Could not delete your data. Please try again.");
    // 5) Login hatao: profile aur roles apne-aap cascade se hat jate hain.
    const { error: aErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (aErr) throw new Error("Could not delete your login. Please try again.");
    return { ok: true };
  });
