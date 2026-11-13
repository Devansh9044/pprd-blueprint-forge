import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const productsQuery = (module: string) => queryOptions({
  queryKey: ["products", module],
  queryFn: async () => {
    const { data, error } = await supabase.from("products").select("*").eq("module", module).order("sort");
    if (error) throw error; return data;
  },
});
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
