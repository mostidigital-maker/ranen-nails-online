import { db, table } from "@/core/supabase/db";
import { assertNoError } from "@/core/errors/appError";
import { moveInList } from "@/shared/utils/ordering";
import type { OrderableRow } from "@/shared/types/common";
import type { PublicService, Service, ServicePayload } from "./types";

const TABLE = "services";
const PUBLIC_COLUMNS =
  "id,name_ar,name_he,description_ar,description_he,price,duration_minutes,image_url,category_id";

export const servicesService = {
  /** Active services for the public site, ordered by admin sort order. */
  async listPublic(): Promise<PublicService[]> {
    const { data, error } = await db
      .from(TABLE)
      .select(PUBLIC_COLUMNS)
      .eq("is_active", true)
      .order("sort_order");
    assertNoError(error);
    return (data || []) as unknown as PublicService[];
  },

  /** Every service, including disabled ones (admin only). */
  async listAll(): Promise<Service[]> {
    const { data, error } = await table(TABLE).select("*").order("sort_order");
    assertNoError(error as { message: string } | null);
    return (data || []) as unknown as Service[];
  },

  async create(payload: ServicePayload): Promise<void> {
    const { error } = await table(TABLE).insert(payload as never);
    assertNoError(error as { message: string } | null);
  },

  async update(id: string, payload: Partial<ServicePayload>): Promise<void> {
    const { error } = await table(TABLE).update(payload as never).eq("id", id);
    assertNoError(error as { message: string } | null);
  },

  async remove(id: string): Promise<void> {
    const { error } = await db.from(TABLE).delete().eq("id", id);
    assertNoError(error);
  },

  async setActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await db.from(TABLE).update({ is_active: isActive }).eq("id", id);
    assertNoError(error);
  },

  async move(rows: readonly OrderableRow[], index: number, dir: -1 | 1): Promise<void> {
    await moveInList(TABLE, rows, index, dir);
  },
};
