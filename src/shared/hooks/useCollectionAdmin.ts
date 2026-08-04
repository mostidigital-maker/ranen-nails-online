import { useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useState } from "react";
import { table } from "@/core/supabase/db";
import { assertNoError, reportError, reportSuccess } from "@/core/errors/appError";
import { moveInList, setActive } from "@/shared/utils/ordering";
import type { ToggleableRow } from "@/shared/types/common";
import type { ValidationResult } from "@/shared/validation/validators";

type Options<T extends ToggleableRow, P> = {
  /** Physical table name. */
  tableName: string;
  /** Query key for the admin (all rows) list. */
  adminKey: QueryKey;
  /** Public query key invalidated after each mutation. */
  publicKey: QueryKey;
  /** Turn the edit draft into an insert/update payload. */
  buildPayload: (draft: Partial<T>) => P;
  /** Payload-level validation; runs before any write. */
  validate: (payload: P) => ValidationResult;
  /** Copy shown on the delete confirmation. */
  confirmDeleteText: string;
  successText: string;
};

/**
 * One generic CRUD controller for every ordered/toggleable CMS collection
 * (services, categories, stats, about cards, testimonials, FAQs…).
 *
 * All Supabase access, validation, ordering and cache invalidation lives here;
 * panels only render.
 */
export function useCollectionAdmin<T extends ToggleableRow, P extends object>(opts: Options<T, P>) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<T> | null>(null);
  const [saving, setSaving] = useState(false);

  const query = useQuery({
    queryKey: opts.adminKey,
    queryFn: async () => {
      const { data, error } = await table(opts.tableName).select("*").order("sort_order");
      assertNoError(error as { message: string } | null);
      return (data || []) as unknown as T[];
    },
  });

  const rows = query.data ?? [];

  function refresh() {
    qc.invalidateQueries({ queryKey: opts.adminKey });
    qc.invalidateQueries({ queryKey: opts.publicKey });
  }

  async function save() {
    if (!editing) return;
    const payload = opts.buildPayload(editing);
    const check = opts.validate(payload);
    if (!check.ok) return reportError(check.message);
    setSaving(true);
    try {
      const { error } = editing.id
        ? await table(opts.tableName).update(payload as never).eq("id", editing.id)
        : await table(opts.tableName).insert(payload as never);
      assertNoError(error as { message: string } | null);
      refresh();
      setEditing(null);
      reportSuccess(opts.successText);
    } catch (err) {
      reportError(err);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm(opts.confirmDeleteText)) return;
    try {
      const { error } = await table(opts.tableName).delete().eq("id", id);
      assertNoError(error as { message: string } | null);
      refresh();
    } catch (err) {
      reportError(err);
    }
  }

  async function toggleActive(row: T) {
    try {
      await setActive(opts.tableName, row.id, !row.is_active);
      refresh();
    } catch (err) {
      reportError(err);
    }
  }

  async function move(index: number, dir: -1 | 1) {
    try {
      await moveInList(opts.tableName, rows, index, dir);
      refresh();
    } catch (err) {
      reportError(err);
    }
  }

  return {
    rows,
    isLoading: query.isLoading,
    error: query.error,
    editing,
    setEditing,
    startCreate: (draft: Partial<T>) => setEditing(draft),
    saving,
    save,
    remove,
    toggleActive,
    move,
    refresh,
  };
}
