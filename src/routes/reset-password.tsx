import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import logo from "@/assets/mba-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password – MBA Savings" },
      { name: "description", content: "Set a new password for your MBA savings account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t } = useT();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      // Email ka reset link kholne se temporary session ban jata hai; na ho to link purana ya galat hai.
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("This reset link has expired. Please request a new one from the sign-in page.");
      if (password.length < 8) throw new Error("Password must be at least 8 characters");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated.");
      nav({ to: "/home", replace: true });
    } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  };
  return (
    <main className="min-h-screen bg-sky flex items-center justify-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-3xl bg-card p-6 shadow-card">
        <div className="flex flex-col items-center gap-1">
          <img src={logo} alt="MBA" width={1024} height={1024} className="h-20 w-20" />
          <h1 className="text-2xl font-bold text-accent">{t("resetPassword")}</h1>
        </div>
        <div className="space-y-1"><Label>{t("newPassword")}</Label><Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <Button disabled={busy} className="w-full h-12 rounded-xl text-base font-bold">{t("setNewPassword")}</Button>
      </form>
    </main>
  );
}
