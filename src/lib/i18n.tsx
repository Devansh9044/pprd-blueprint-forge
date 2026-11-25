import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "hi";
const dict = {
  welcome: { en: "Welcome to MBA", hi: "MBA में आपका स्वागत है" },
  tagline: { en: "Dream Big, Save Smart, Achieve More!", hi: "बड़े सपने देखो, समझदारी से बचत करो, और जिंदगी में आगे बढ़ो!" },
  support: { en: "Your Personal Savings Partner for a Prosperous Future.", hi: "आपके सुनहरे भविष्य के लिए अपना बचत साथी।" },
  start: { en: "GET STARTED", hi: "शुरू करें" },
  dreamLine1: { en: "Dream big…", hi: "बड़े सपने देखो…" },
  dreamLine2: { en: "Make them happen with MBA!", hi: "MBA के साथ उन्हें पूरा करो!" },
  hello: { en: "Hello", hi: "नमस्ते" },
  totalSaving: { en: "Total Saving", hi: "कुल बचत" },
  streak: { en: "Day Streak", hi: "दिन की लय" },
  activeGoals: { en: "Active Goals", hi: "सक्रिय लक्ष्य" },
  rewards: { en: "Rewards", hi: "इनाम" },
  recharge: { en: "Mobile Recharge", hi: "मोबाइल रिचार्ज" },
  mobile: { en: "Mobile", hi: "मोबाइल" },
  laptop: { en: "Laptop", hi: "लैपटॉप" },
  bike: { en: "Bike", hi: "बाइक" },
  college: { en: "College Saving", hi: "कॉलेज बचत" },
  custom: { en: "Custom Saving", hi: "कस्टम बचत" },
  home: { en: "Home", hi: "होम" },
  goals: { en: "Goals", hi: "लक्ष्य" },
  settings: { en: "Settings", hi: "सेटिंग्स" },
  perDay: { en: "/day", hi: "/दिन" },
  startSaving: { en: "Start saving", hi: "बचत शुरू करें" },
  payToday: { en: "Pay today's saving", hi: "आज की बचत जमा करें" },
  language: { en: "Language", hi: "भाषा" },
  signOut: { en: "Sign out", hi: "साइन आउट" },
  history: { en: "History", hi: "इतिहास" },
  skip: { en: "Skip", hi: "छोड़ें" },
  welcomeBack: { en: "Welcome back", hi: "वापसी पर स्वागत है" },
  createAccount: { en: "Create account", hi: "खाता बनाएँ" },
  fullName: { en: "Full name", hi: "पूरा नाम" },
  mobileNumber: { en: "Mobile number", hi: "मोबाइल नंबर" },
  email: { en: "Email", hi: "ईमेल" },
  password: { en: "Password", hi: "पासवर्ड" },
  signIn: { en: "Sign in", hi: "साइन इन" },
  signUp: { en: "Sign up", hi: "साइन अप" },
  newToMba: { en: "New to MBA? Create an account", hi: "MBA में नए हैं? खाता बनाएँ" },
  haveAccount: { en: "Already have an account? Sign in", hi: "पहले से खाता है? साइन इन करें" },
  saveProfile: { en: "Save profile", hi: "प्रोफ़ाइल सेव करें" },
} as const;
export type Key = keyof typeof dict;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string }>({
  lang: "en", setLang: () => {}, t: (k) => dict[k].en,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const s = localStorage.getItem("mba-lang");
    if (s === "hi" || s === "en") setLangState(s);
  }, []);
  // Screen reader / font ke liye <html lang> bhi bhasha ke saath badle.
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const setLang = (l: Lang) => { setLangState(l); localStorage.setItem("mba-lang", l); };
  return <Ctx.Provider value={{ lang, setLang, t: (k) => dict[k][lang] }}>{children}</Ctx.Provider>;
}
export const useT = () => useContext(Ctx);
