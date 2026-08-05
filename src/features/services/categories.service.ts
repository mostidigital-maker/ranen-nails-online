import { table } from "@/core/supabase/db";
import { assertNoError } from "@/core/errors/appError";
import { moveInList } from "@/shared/utils/ordering";
import type { OrderableRow } from "@/shared/types/common";
import type { CategoryPayload, ServiceCategory } from "./types";

const TABLE = "service_categories";

export const categoriesService = {
  async list(activeOnly = true): Promise<ServiceCategory[]> {
    let q = table(TABLE).select("*").order("sort_order");
    if (activeOnly) q = q.eq("is_active", true);
    const { data, error } = await q;
    assertNoError(error as { message: string } | null);
    return (data || []) as unknown as ServiceCategory[];
  },

  async create(payload: CategoryPayload): Promise<void> {
    const { error } = await table(TABLE).insert(payload as never);
    assertNoError(error as { message: string } | null);
  },

  async update(id: string, payload: Partial<CategoryPayload>): Promise<void> {
    const { error } = await table(TABLE).update(payload as never).eq("id", id);
    assertNoError(error as { message: string } | null);
  },

  async remove(id: string): Promise<void> {
    const { error } = await table(TABLE).delete().eq("id", id);
    assertNoError(error as { message: string } | null);
  },

  async move(rows: readonly OrderableRow[], index: number, dir: -1 | 1): Promise<void> {
    await moveInList(TABLE, rows, index, dir);
  },
};
