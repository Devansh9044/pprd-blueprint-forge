import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/mba/AppShell";
import { ProductList } from "@/components/mba/ProductList";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/laptop")({
  head: () => ({ meta: [{ title: "Laptop Saving – MBA" }, { name: "description", content: "Save daily for a MacBook, HP or ASUS laptop." }] }),
  component: () => {
    const { t } = useT();
    return (
      <AppShell title={t("laptop")} back>
        <ProductList module="laptop" filterable={true} />
      </AppShell>
    );
  },
});
