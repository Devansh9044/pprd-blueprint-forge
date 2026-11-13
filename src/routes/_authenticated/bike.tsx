import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/mba/AppShell";
import { ProductList } from "@/components/mba/ProductList";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/bike")({
  head: () => ({ meta: [{ title: "Bike Saving – MBA" }, { name: "description", content: "Save daily for your dream bike." }] }),
  component: () => {
    const { t } = useT();
    return (
      <AppShell title={t("bike")} back>
        <ProductList module="bike" filterable={true} />
      </AppShell>
    );
  },
});
