import { table } from "@/core/supabase/db";
import { assertNoError } from "@/core/errors/appError";
import type { ServiceCategory } from "./types";

const TABLE = "service_categories";

export const categoriesService = {
  async list(activeOnly = true): Promise<ServiceCategory[]> {
    let q = table(TABLE).select("*").order("sort_order");
    if (activeOnly) q = q.eq("is_active", true);
    const { data, error } = await q;
    assertNoError(error as { message: string } | null);
    return (data || []) as unknown as ServiceCategory[];
  },
};
