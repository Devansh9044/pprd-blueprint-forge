import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import logo from "@/assets/mba-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in – MBA Savings" },
      { name: "description", content: "Sign in or create your MBA savings account." },
      { property: "og:title", content: "Sign in – MBA Savings" },
      { property: "og:description", content: "Start your daily saving habit with MBA." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useT();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [f, setF] = useState({ email: "", password: "", name: "", mobile: "" });
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  // Pehle se login user ko login form dobara mat dikhao.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/home", replace: true });
    });
  }, [nav]);
  const forgot = async () => {
    if (busy) return;
    const email = f.email.trim();
    if (!email) { toast.error("Enter your email first"); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
      if (error) { toast.error(error.message); return; }
      toast.success("If this email has an account, a reset link is on its way.");
    } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      // Keyboard autocomplete ka extra space hata do.
      const email = f.email.trim();
      if (mode === "up") {
        // Naam me sirf space ho to reject karo, aur trimmed naam hi save karo.
        const name = f.name.trim();
        if (!name) throw new Error("Enter your full name");
        if (!/^[6-9]\d{9}$/.test(f.mobile)) throw new Error("Enter a valid 10-digit mobile number");
        // Naya password kam se kam 8 characters (purane users ke sign-in pe asar nahi).
        if (f.password.length < 8) throw new Error("Password must be at least 8 characters");
        const { data, error } = await supabase.auth.signUp({
          email, password: f.password,
          options: { emailRedirectTo: window.location.origin + "/home", data: { full_name: name, mobile_number: f.mobile } },
        });
        if (error) throw error;
        if (!data.session) { toast.success("Check your email to confirm your account."); return; }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: f.password });
        if (error) throw error;
      }
      nav({ to: "/home" });
    } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  };
  return (
    <main className="min-h-screen bg-sky flex items-center justify-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-3xl bg-card p-6 shadow-card">
        <div className="flex flex-col items-center gap-1">
          <img src={logo} alt="MBA" width={1024} height={1024} className="h-20 w-20" />
          <h1 className="text-2xl font-bold text-accent">{mode === "in" ? t("welcomeBack") : t("createAccount")}</h1>
        </div>
        {mode === "up" && (<>
          <div className="space-y-1"><Label>{t("fullName")}</Label><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="space-y-1"><Label>{t("mobileNumber")}</Label><Input required inputMode="numeric" maxLength={10} value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value.replace(/\D/g, "") })} /></div>
        </>)}
        <div className="space-y-1"><Label>{t("email")}</Label><Input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div className="space-y-1"><Label>{t("password")}</Label><Input type="password" required minLength={mode === "up" ? 8 : 6} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
        <Button disabled={busy} className="w-full h-12 rounded-xl text-base font-bold">{mode === "in" ? t("signIn") : t("signUp")}</Button>
        {mode === "in" && <button type="button" disabled={busy} onClick={forgot} className="w-full text-sm text-muted-foreground disabled:opacity-50">{t("forgotPassword")}</button>}
        <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-sm text-accent font-medium">
          {mode === "in" ? t("newToMba") : t("haveAccount")}
        </button>
        <p className="text-center text-xs text-muted-foreground">
          {mode === "up" ? "By creating an account you confirm you are 18 or older and accept our " : "See our "}
          <a href="/terms" className="font-semibold text-primary underline">Terms &amp; Refund Policy</a> and{" "}
          <a href="/privacy" className="font-semibold text-primary underline">Privacy Policy</a>.
        </p>
      </form>
    </main>
  );
}
