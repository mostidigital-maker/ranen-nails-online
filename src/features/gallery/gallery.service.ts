import { db, storage } from "@/core/supabase/db";
import { APP_CONFIG } from "@/core/config/app.config";
import { AppError, assertNoError } from "@/core/errors/appError";
import type { GalleryItem, PublicGalleryItem } from "./types";

const TABLE = "gallery_items";
const BUCKET = APP_CONFIG.storage.galleryBucket;

/** Replaces `media_url` with a fresh signed URL for storage-backed rows. */
async function signRows<T extends { storage_path: string | null; media_url: string }>(rows: T[], ttl: number) {
  await Promise.all(
    rows.map(async (row) => {
      if (!row.storage_path) return;
      const { data: signed } = await storage.from(BUCKET).createSignedUrl(row.storage_path, ttl);
      if (signed?.signedUrl) row.media_url = signed.signedUrl;
    }),
  );
  return rows;
}

export const galleryService = {
  async listPublic(): Promise<PublicGalleryItem[]> {
    const { data, error } = await db
      .from(TABLE)
      .select("id,media_type,storage_path,media_url,caption")
      .eq("is_active", true)
      .order("sort_order")
      .order("created_at", { ascending: false });
    assertNoError(error);
    return signRows((data || []) as unknown as PublicGalleryItem[], APP_CONFIG.media.publicSignedUrlTtl);
  },

  async listAll(): Promise<GalleryItem[]> {
    const { data, error } = await db
      .from(TABLE)
      .select("*")
      .order("sort_order")
      .order("created_at", { ascending: false });
    assertNoError(error);
    return signRows((data || []) as unknown as GalleryItem[], APP_CONFIG.media.adminSignedUrlTtl);
  },

  /** Validates, uploads to storage and creates the row. */
  async upload(file: File, caption: string, sortOrder: number, messages: { badType: string; tooLarge: string }) {
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) throw new AppError(messages.badType, "validation");
    if (file.size > APP_CONFIG.media.maxUploadBytes) throw new AppError(messages.tooLarge, "validation");

    const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: upErr } = await storage.from(BUCKET).upload(path, file, { contentType: file.type });
    assertNoError(upErr as { message: string } | null);

    const { error: insErr } = await db.from(TABLE).insert({
      media_type: isVideo ? "video" : "image",
      storage_path: path,
      media_url: path,
      caption: caption.trim() || null,
      sort_order: sortOrder,
    });
    assertNoError(insErr);
  },

  async setActive(id: string, isActive: boolean) {
    const { error } = await db.from(TABLE).update({ is_active: isActive }).eq("id", id);
    assertNoError(error);
  },

  async remove(item: Pick<GalleryItem, "id" | "storage_path">) {
    if (item.storage_path) await storage.from(BUCKET).remove([item.storage_path]);
    const { error } = await db.from(TABLE).delete().eq("id", item.id);
    assertNoError(error);
  },
};
