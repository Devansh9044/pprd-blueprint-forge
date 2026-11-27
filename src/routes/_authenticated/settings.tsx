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
import { DeleteAccountPanel } from "@/components/mba/DeleteAccount";

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
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (me?.profile) setF({ full_name: me.profile.full_name ?? "", mobile_number: me.profile.mobile_number ?? "" }); }, [me?.profile]);
  const save = async () => {
    if (!me || busy) return;
    const full_name = f.full_name.trim();
    if (!full_name) { toast.error("Enter your name"); return; }
    if (!/^[6-9]\d{9}$/.test(f.mobile_number)) { toast.error("Enter a valid 10-digit mobile number"); return; }
    setBusy(true);
    try {
      const { error } = await supabase.from("profiles").update({ full_name, mobile_number: f.mobile_number }).eq("id", me.id);
      if (error) toast.error(error.message); else { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["me"] }); }
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };
  const out = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); nav({ to: "/auth", replace: true });
    } catch (e) { toast.error((e as Error).message); setBusy(false); }
  };
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
        <Button disabled={busy} onClick={save} className="w-full">{t("saveProfile")}</Button>
      </div>
      <Button variant="outline" disabled={busy} onClick={out} className="mt-4 w-full">{t("signOut")}</Button>
      <div className="mt-6 space-y-3 rounded-3xl bg-card p-5 shadow-card">
        <div className="flex gap-4 text-sm font-semibold text-primary">
          <a href="/privacy" className="underline">Privacy Policy</a>
          <a href="/terms" className="underline">Terms &amp; Refund</a>
        </div>
        <p className="text-xs text-muted-foreground">Deleting your account removes your login and data. Money still saved in a goal must be settled first.</p>
        <DeleteAccountPanel />
      </div>
    </AppShell>
  );
}
