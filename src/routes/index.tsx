import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import logo from "@/assets/mba-logo.png";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MBA – Dream Big, Save Smart, Achieve More!" },
      { name: "description", content: "MBA helps you save small amounts daily for recharge, mobile, laptop, bike and college goals." },
      { property: "og:title", content: "MBA – Small Savings, Big Goals" },
      { property: "og:description", content: "Your personal savings partner for a prosperous future." },
    ],
  }),
  component: Index,
});

function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3400); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed inset-0 overflow-hidden bg-sky flex items-center justify-center">
      {Array.from({ length: 14 }).map((_, i) => (
        <span key={i} className="absolute top-0 animate-coin flex h-7 w-7 items-center justify-center rounded-full bg-gold text-xs font-bold text-accent"
          style={{ left: `${(i * 7.3) % 100}%`, animationDelay: `${(i % 5) * 0.35}s` }}>₹</span>
      ))}
      <TrendingUp className="absolute animate-arrow h-40 w-40 text-accent" strokeWidth={2.5} />
      <img src={logo} alt="MBA" width={1024} height={1024} className="relative h-48 w-48 animate-logo" />
      <button onClick={onDone} className="absolute bottom-8 right-6 text-sm text-muted-foreground underline">Skip</button>
    </div>
  );
}

function Index() {
  const [splash, setSplash] = useState(true);
  const { t, lang, setLang } = useT();
  const nav = useNavigate();
  const go = async () => {
    const { data } = await supabase.auth.getSession();
    nav({ to: data.session ? "/home" : "/auth" });
  };
  if (splash) return <Splash onDone={() => setSplash(false)} />;
  return (
    <main className="min-h-screen bg-sky flex flex-col items-center justify-between px-6 py-10 text-center">
      <div className="flex gap-2 self-end rounded-full bg-card p-1 shadow-card">
        {(["en", "hi"] as const).map((l) => (
          <button key={l} onClick={() => setLang(l)}
            className={`rounded-full px-4 py-1 text-sm font-semibold ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            {l === "en" ? "English" : "हिंदी"}
          </button>
        ))}
      </div>
      <div className="flex flex-col items-center gap-4 max-w-sm">
        <img src={logo} alt="MBA logo" width={1024} height={1024} className="h-40 w-40" />
        <h1 className="text-4xl font-extrabold text-accent">{t("welcome")}</h1>
        <p className="text-xl font-semibold text-primary">{t("tagline")}</p>
        <p className="text-muted-foreground">{t("support")}</p>
      </div>
      <Button size="lg" onClick={go} className="w-full max-w-sm h-14 rounded-2xl bg-accent text-accent-foreground text-lg font-bold hover:bg-accent/90">{t("start")}</Button>
    </main>
  );
}
