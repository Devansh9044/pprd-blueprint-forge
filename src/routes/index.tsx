import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, TrendingUp } from "lucide-react";
import logo from "@/assets/mba-logo.png";
import sky from "@/assets/welcome-sky.jpg";
import plane from "@/assets/welcome-plane.png";
import { useT } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MBA – Dream Big, Save Smart, Achieve More!" },
      { name: "description", content: "MBA – My Budget Assistant helps you save small amounts daily for recharge, mobile, laptop, bike and college goals." },
      { property: "og:title", content: "MBA – My Budget Assistant" },
      { property: "og:description", content: "Dream Big, Save Smart, Achieve More! Your personal savings partner." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const d = (s: number): CSSProperties => ({ animationDelay: `${s}s` });

function Splash({ onDone }: { onDone: () => void }) {
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => { const t = setTimeout(() => done.current(), 3400); return () => clearTimeout(t); }, []);
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

function Coin({ size, className, delay }: { size: number; className: string; delay: number }) {
  return (
    <span className={`absolute flex items-center justify-center rounded-full border-4 border-gold bg-gold font-extrabold text-primary-foreground shadow-card animate-coin-bob ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.45, ...d(delay), boxShadow: "inset 0 -4px 0 color-mix(in oklab, var(--accent) 25%, transparent)" }}>₹</span>
  );
}

/** Bars + rising arrow, drawn in SVG so every part can animate. */
function GrowthChart() {
  const bars = [{ x: 30, h: 55 }, { x: 80, h: 75 }, { x: 130, h: 98 }, { x: 180, h: 125 }, { x: 230, h: 160 }];
  return (
    <svg viewBox="0 0 300 210" className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-md" aria-hidden>
      <defs>
        <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--primary)" }} />
          <stop offset="1" style={{ stopColor: "var(--accent)" }} />
        </linearGradient>
        <linearGradient id="arrow" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: "var(--accent)" }} />
          <stop offset="1" style={{ stopColor: "var(--primary)" }} />
        </linearGradient>
      </defs>
      {bars.map((b, i) => (
        <rect key={b.x} x={b.x} y={200 - b.h} width={38} height={b.h} rx={4} fill="url(#bar)" opacity={0.92} className="animate-bar" style={d(0.3 + i * 0.15)} />
      ))}
      <path d="M 0 192 Q 150 215 290 150" fill="none" stroke="var(--gold)" strokeWidth={3} strokeLinecap="round" pathLength={1} className="animate-draw" style={d(1.4)} opacity={0.8} />
      <path d="M 8 196 Q 190 205 272 48" fill="none" stroke="url(#arrow)" strokeWidth={14} strokeLinecap="round" pathLength={1} className="animate-draw" style={d(1.1)} />
      <g transform="translate(272 48) rotate(-62)">
        <polygon points="-6,-22 30,0 -6,22" fill="var(--accent)" className="animate-pop" style={d(2.3)} />
      </g>
    </svg>
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
    <main className="relative min-h-[100dvh] overflow-hidden bg-sky">
      <img src={sky} alt="" width={768} height={1152} className="absolute inset-0 h-full w-full object-cover animate-drift" />
      <div className="relative mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 pb-6 pt-4">
        <div className="flex gap-1 self-end rounded-full bg-card/80 p-1 shadow-card backdrop-blur">
          {(["en", "hi"] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              className={`rounded-full px-3 py-0.5 text-xs font-semibold ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              {l === "en" ? "English" : "हिंदी"}
            </button>
          ))}
        </div>

        {/* Logo */}
        <div className="mt-1 flex flex-col items-center animate-fade-up">
          <svg viewBox="0 0 120 50" className="h-9 w-24 -mb-2 ml-16" aria-hidden>
            {[0, 1, 2, 3].map((i) => <rect key={i} x={6 + i * 14} y={38 - i * 7} width={9} height={8 + i * 7} rx={1.5} fill="var(--primary)" className="animate-bar" style={d(0.2 + i * 0.1)} />)}
            <path d="M 10 40 Q 60 35 100 10" fill="none" stroke="var(--accent)" strokeWidth={5} strokeLinecap="round" pathLength={1} className="animate-draw" style={d(0.5)} />
            <polygon points="92,4 112,4 104,20" fill="var(--accent)" className="animate-pop" style={d(1.2)} />
          </svg>
          <h1 className="font-display text-5xl font-extrabold leading-none tracking-tight text-accent">MBA</h1>
          <div className="mt-1 flex items-center gap-2 text-accent">
            <span className="h-px w-8 bg-accent" /><span className="text-sm font-bold">My Budget Assistant</span><span className="h-px w-8 bg-accent" />
          </div>
        </div>

        {/* Animated scene */}
        <div className="relative mt-2 h-[30vh] min-h-40 max-h-80">
          <Coin size={54} className="left-[6%] top-[4%]" delay={0.6} />
          <Coin size={44} className="left-[0%] top-[34%]" delay={0.8} />
          <Coin size={32} className="left-[28%] top-[24%]" delay={1} />
          <Coin size={24} className="left-[20%] top-[52%]" delay={1.2} />
          <img src={plane} alt="" width={640} height={196} className="absolute -top-[8%] right-0 z-10 w-[58%] animate-plane drop-shadow-xl" />
          <GrowthChart />
        </div>

        {/* Text */}
        <div className="mt-2 flex flex-1 flex-col items-center justify-end gap-2.5 text-center">
          <p className="font-display text-[1.7rem] font-extrabold italic leading-[1.15] text-accent animate-fade-up" style={d(1.6)}>
            Dream Big,<br />Save Smart,<br />Achieve More!
          </p>
          <div className="w-full rounded-2xl border border-card bg-card/60 px-4 py-1.5 text-sm font-semibold text-accent backdrop-blur animate-fade-up" style={d(1.9)}>
            <p>{t("dreamLine1")}</p><p>{t("dreamLine2")}</p>
          </div>
          <button onClick={go}
            className="relative flex h-13 w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-hero text-xl font-bold text-primary-foreground shadow-card transition active:scale-95 animate-fade-up"
            style={d(2.2)}>
            <span className="pointer-events-none absolute inset-0 animate-shine" />
            {t("start")} <ArrowRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </main>
  );
}
