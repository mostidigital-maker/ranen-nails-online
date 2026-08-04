import { useQuery } from "@tanstack/react-query";
import { createContentCollectionService } from "@/shared/services/contentCollection.service";
import { QK } from "@/core/config/queryKeys";
import { APP_CONFIG } from "@/core/config/app.config";

export type AboutCard = {
  id: string;
  icon: string;
  title_ar: string;
  title_he: string;
  text_ar: string;
  text_he: string;
  sort_order: number;
  is_active: boolean;
};

export const aboutService = createContentCollectionService<AboutCard>("about_cards");

export function usePublicAboutCards() {
  return useQuery({
    queryKey: QK.aboutPublic,
    queryFn: () => aboutService.listActive(),
    staleTime: APP_CONFIG.cache.contentStaleTime,
  });
}
