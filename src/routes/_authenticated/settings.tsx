import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/mba/AppShell";
import { meQuery } from "@/components/mba/data";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings – MBA" }, { name: "description", content: "Language and profile settings." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t, lang, setLang } = useT();
  const { data: me } = useQuery(meQuery);
  const qc = useQueryClient();
  const nav = useNavigate();
  const [f, setF] = useState({ full_name: "", mobile_number: "" });
  useEffect(() => { if (me?.profile) setF({ full_name: me.profile.full_name ?? "", mobile_number: me.profile.mobile_number ?? "" }); }, [me?.profile]);
  const save = async () => {
    if (!me) return;
    const full_name = f.full_name.trim();
    if (!full_name) { toast.error("Enter your name"); return; }
    if (!/^[6-9]\d{9}$/.test(f.mobile_number)) { toast.error("Enter a valid 10-digit mobile number"); return; }
    const { error } = await supabase.from("profiles").update({ full_name, mobile_number: f.mobile_number }).eq("id", me.id);
    if (error) toast.error(error.message); else { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["me"] }); }
  };
  const out = async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); nav({ to: "/auth", replace: true }); };
  return (
    <AppShell title={t("settings")}>
      <div className="space-y-4 rounded-3xl bg-card p-5 shadow-card">
        <Label>{t("language")}</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["en", "hi"] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)} className={`rounded-xl border py-2 font-bold ${lang === l ? "border-primary bg-primary text-primary-foreground" : ""}`}>{l === "en" ? "English" : "हिंदी"}</button>
          ))}
        </div>
      </div>
      <div className="mt-4 space-y-3 rounded-3xl bg-card p-5 shadow-card">
        <p className="text-sm text-muted-foreground">{me?.email}</p>
        <div className="space-y-1"><Label>{t("fullName")}</Label><Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
        <div className="space-y-1"><Label>{t("mobileNumber")}</Label><Input maxLength={10} value={f.mobile_number} onChange={(e) => setF({ ...f, mobile_number: e.target.value.replace(/\D/g, "") })} /></div>
        <Button onClick={save} className="w-full">{t("saveProfile")}</Button>
      </div>
      <Button variant="outline" onClick={out} className="mt-4 w-full">{t("signOut")}</Button>
    </AppShell>
  );
}
