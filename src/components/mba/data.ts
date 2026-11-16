import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const productsQuery = (module: string) => queryOptions({
  queryKey: ["products", module],
  queryFn: async () => {
    const { data, error } = await supabase.from("products").select("*").eq("module", module).order("sort");
    if (error) throw error; return withImageSrc(data);
  },
});

/** Photos uploaded in Admin are stored as "storage:<path>" in the private product-images folder; others are plain links. */
export const STORAGE_PREFIX = "storage:";
export async function withImageSrc<T extends { image_url: string | null }>(rows: T[]): Promise<(T & { image_src: string | null })[]> {
  const paths = rows.map((r) => r.image_url).filter((u): u is string => !!u?.startsWith(STORAGE_PREFIX)).map((u) => u.slice(STORAGE_PREFIX.length));
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from("product-images").createSignedUrls(paths, 60 * 60 * 24 * 7);
    data?.forEach((d) => d.path && d.signedUrl && signed.set(d.path, d.signedUrl));
  }
  return rows.map((r) => ({ ...r, image_src: r.image_url?.startsWith(STORAGE_PREFIX) ? signed.get(r.image_url.slice(STORAGE_PREFIX.length)) ?? null : r.image_url }));
}

export const PAYMENT_STATUS: Record<string, string> = {
  pending: "Not paid", submitted: "Checking", verified: "Verified", rejected: "Rejected", expired: "Expired",
};
export const goalsQuery = queryOptions({
  queryKey: ["goals"],
  queryFn: async () => {
    const { data, error } = await supabase.from("saving_goals").select("*").order("created_at", { ascending: false });
    if (error) throw error; return data;
  },
});
export const txQuery = queryOptions({
  queryKey: ["tx"],
  queryFn: async () => {
    const { data, error } = await supabase.from("transactions").select("*, saving_goals(goal_name)").order("created_at", { ascending: false });
    if (error) throw error; return data;
  },
});
export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    const id = u.user!.id;
    const [p, r, s, rw] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", id),
      supabase.from("streaks").select("*").eq("user_id", id).maybeSingle(),
      supabase.from("rewards").select("*").order("created_at", { ascending: false }),
    ]);
    return { id, email: u.user!.email, profile: p.data, isAdmin: !!r.data?.some((x) => x.role === "admin"), streak: s.data, rewards: rw.data ?? [] };
  },
});
export const configQuery = queryOptions({
  queryKey: ["config"],
  queryFn: async () => {
    const { data } = await supabase.from("app_config").select("*");
    return Object.fromEntries((data ?? []).map((c) => [c.key, c.value])) as Record<string, string>;
  },
});
