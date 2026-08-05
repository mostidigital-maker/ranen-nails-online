import { table } from "@/core/supabase/db";
import { assertNoError } from "@/core/errors/appError";
import { moveInList, setActive } from "@/shared/utils/ordering";
import type { OrderableRow } from "@/shared/types/common";

/**
 * Factory for the CMS collections that share the exact same read/write shape:
 * ordered by `sort_order`, optionally filtered to `is_active`.
 * (stats, about cards, testimonials, faqs …)
 */
export function createContentCollectionService<T>(tableName: string) {
  return {
    tableName,
    async listActive(): Promise<T[]> {
      const { data, error } = await table(tableName)
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      assertNoError(error as { message: string } | null);
      return (data || []) as unknown as T[];
    },
    async listAll(): Promise<T[]> {
      const { data, error } = await table(tableName).select("*").order("sort_order");
      assertNoError(error as { message: string } | null);
      return (data || []) as unknown as T[];
    },
    async create(payload: Record<string, unknown>): Promise<void> {
      const { error } = await table(tableName).insert(payload as never);
      assertNoError(error as { message: string } | null);
    },
    async update(id: string, payload: Record<string, unknown>): Promise<void> {
      const { error } = await table(tableName).update(payload as never).eq("id", id);
      assertNoError(error as { message: string } | null);
    },
    async remove(id: string): Promise<void> {
      const { error } = await table(tableName).delete().eq("id", id);
      assertNoError(error as { message: string } | null);
    },
    async setActive(id: string, isActive: boolean): Promise<void> {
      await setActive(tableName, id, isActive);
    },
    async move(rows: readonly OrderableRow[], index: number, dir: -1 | 1): Promise<void> {
      await moveInList(tableName, rows, index, dir);
    },
  };
}
