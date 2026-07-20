import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  id: number;
  business_name_ar: string;
  business_name_he: string;
  tagline_ar: string;
  tagline_he: string;
  logo_url: string | null;
  hero_title_ar: string;
  hero_title_he: string;
  hero_subtitle_ar: string;
  hero_subtitle_he: string;
  hero_image_url: string | null;
  about_title_ar: string;
  about_title_he: string;
  about_text_ar: string;
  about_text_he: string;
  phone: string;
  whatsapp: string;
  instagram: string | null;
  address_ar: string;
  address_he: string;
  maps_url: string | null;
  hours_text_ar: string;
  hours_text_he: string;
  footer_text_ar: string;
  footer_text_he: string;
};

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings" as never).select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data as unknown as SiteSettings | null;
    },
    staleTime: 60_000,
  });
}
