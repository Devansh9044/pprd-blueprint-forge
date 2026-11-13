import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/mba/AppShell";
import { ProductList } from "@/components/mba/ProductList";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/mobile")({
  head: () => ({ meta: [{ title: "Mobile Saving – MBA" }, { name: "description", content: "Save daily for an Android phone or iPhone." }] }),
  component: () => {
    const { t } = useT();
    const [tab, setTab] = useState<"android" | "iphone">("android");
    return (
      <AppShell title={t("mobile")} back>
        <div className="mb-4 grid grid-cols-2 rounded-2xl bg-card p-1 shadow-card">
          {(["android", "iphone"] as const).map((k) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-xl py-2 font-bold ${tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{k === "android" ? "Android" : "iPhone"}</button>
          ))}
        </div>
        <ProductList key={tab} module={tab} filterable={tab === "android"} />
      </AppShell>
    );
  },
});
