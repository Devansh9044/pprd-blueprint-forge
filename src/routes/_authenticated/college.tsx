import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/mba/AppShell";
import { ProductList } from "@/components/mba/ProductList";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/college")({
  head: () => ({ meta: [{ title: "College Saving – MBA" }, { name: "description", content: "Small daily savings for college." }] }),
  component: () => {
    const { t } = useT();
    return (
      <AppShell title={t("college")} back>
        <ProductList module="college" filterable={false} />
      </AppShell>
    );
  },
});
