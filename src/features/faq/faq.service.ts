import { useQuery } from "@tanstack/react-query";
import { createContentCollectionService } from "@/shared/services/contentCollection.service";
import { QK } from "@/core/config/queryKeys";
import { APP_CONFIG } from "@/core/config/app.config";

export type Faq = {
  id: string;
  question_ar: string;
  question_he: string;
  answer_ar: string;
  answer_he: string;
  sort_order: number;
  is_active: boolean;
};

export const faqService = createContentCollectionService<Faq>("faqs");

export function usePublicFaqs() {
  return useQuery({
    queryKey: QK.faqsPublic,
    queryFn: () => faqService.listActive(),
    staleTime: APP_CONFIG.cache.contentStaleTime,
  });
}
