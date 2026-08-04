import { useQuery } from "@tanstack/react-query";
import { createContentCollectionService } from "@/shared/services/contentCollection.service";
import { QK } from "@/core/config/queryKeys";
import { APP_CONFIG } from "@/core/config/app.config";

export type Testimonial = {
  id: string;
  name: string;
  text_ar: string;
  text_he: string;
  rating: number;
  sort_order: number;
  is_active: boolean;
};

export const testimonialsService = createContentCollectionService<Testimonial>("testimonials");

export function usePublicTestimonials() {
  return useQuery({
    queryKey: QK.testimonialsPublic,
    queryFn: () => testimonialsService.listActive(),
    staleTime: APP_CONFIG.cache.contentStaleTime,
  });
}
