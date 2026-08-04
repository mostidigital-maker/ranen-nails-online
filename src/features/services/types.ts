export type Service = {
  id: string;
  name_ar: string;
  name_he: string;
  description_ar: string | null;
  description_he: string | null;
  price: number;
  duration_minutes: number;
  image_url: string | null;
  category_id: string | null;
  is_active: boolean;
  sort_order: number;
};

/** Public listings only need a subset of the row. */
export type PublicService = Omit<Service, "is_active" | "sort_order">;

export type ServiceCategory = {
  id: string;
  slug?: string;
  name_ar: string;
  name_he: string;
  sort_order: number;
  is_active: boolean;
};

export type ServicePayload = Omit<Service, "id">;
export type CategoryPayload = Omit<ServiceCategory, "id" | "slug">;
