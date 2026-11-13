import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import logo from "@/assets/mba-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [mode, setMode] = useState<"in" | "up">("in");
  const [f, setF] = useState({ email: "", password: "", name: "", mobile: "" });
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      if (mode === "up") {
        if (!/^[6-9]\d{9}$/.test(f.mobile)) throw new Error("Enter a valid 10-digit mobile number");
        const { data, error } = await supabase.auth.signUp({
          email: f.email, password: f.password,
          options: { emailRedirectTo: window.location.origin + "/home", data: { full_name: f.name, mobile_number: f.mobile } },
        });
        if (error) throw error;
        if (!data.session) { toast.success("Check your email to confirm your account."); return; }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
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
          <h1 className="text-2xl font-bold text-accent">{mode === "in" ? "Welcome back" : "Create account"}</h1>
        </div>
        {mode === "up" && (<>
          <div className="space-y-1"><Label>Full name</Label><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="space-y-1"><Label>Mobile number</Label><Input required inputMode="numeric" maxLength={10} value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value.replace(/\D/g, "") })} /></div>
        </>)}
        <div className="space-y-1"><Label>Email</Label><Input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div className="space-y-1"><Label>Password</Label><Input type="password" required minLength={6} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
        <Button disabled={busy} className="w-full h-12 rounded-xl text-base font-bold">{mode === "in" ? "Sign in" : "Sign up"}</Button>
        <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-sm text-accent font-medium">
          {mode === "in" ? "New to MBA? Create an account" : "Already have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}
