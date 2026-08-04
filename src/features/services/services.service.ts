import { db, table } from "@/core/supabase/db";
import { assertNoError } from "@/core/errors/appError";
import type { PublicService, Service } from "./types";

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
};
