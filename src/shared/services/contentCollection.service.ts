import { table } from "@/core/supabase/db";
import { assertNoError } from "@/core/errors/appError";

/**
 * Factory for the CMS collections that share the exact same read shape:
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
  };
}
