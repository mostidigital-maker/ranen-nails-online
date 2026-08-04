export type GalleryMediaType = "image" | "video";

export type GalleryItem = {
  id: string;
  media_type: GalleryMediaType;
  storage_path: string | null;
  media_url: string;
  caption: string | null;
  sort_order: number;
  is_active: boolean;
};

export type PublicGalleryItem = Omit<GalleryItem, "sort_order" | "is_active">;
