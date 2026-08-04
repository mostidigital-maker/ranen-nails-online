import { table } from "@/core/supabase/db";
import type { OrderableRow } from "@/shared/types/common";

/**
 * Generic ordering / visibility helpers shared by every CMS collection.
 * These are pure data operations, deliberately kept out of components.
 */
export async function swapOrder(tableName: string, a: OrderableRow, b: OrderableRow) {
  await table(tableName).update({ sort_order: b.sort_order } as never).eq("id", a.id);
  await table(tableName).update({ sort_order: a.sort_order } as never).eq("id", b.id);
}

/** Move item at `index` by `dir` (-1 up, +1 down) within an ordered list. */
export async function moveInList<T extends OrderableRow>(
  tableName: string,
  rows: readonly T[],
  index: number,
  dir: -1 | 1,
) {
  const a = rows[index];
  const b = rows[index + dir];
  if (!a || !b) return;
  await swapOrder(tableName, a, b);
}

export async function setActive(tableName: string, id: string, isActive: boolean) {
  await table(tableName).update({ is_active: isActive } as never).eq("id", id);
}
