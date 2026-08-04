import { useQuery } from "@tanstack/react-query";
import { createContentCollectionService } from "@/shared/services/contentCollection.service";
import { QK } from "@/core/config/queryKeys";
import { APP_CONFIG } from "@/core/config/app.config";

export type Stat = {
  id: string;
  label_ar: string;
  label_he: string;
  value: number;
  suffix: string | null;
  sort_order: number;
  is_active: boolean;
};

export const statsService = createContentCollectionService<Stat>("stats");

export function usePublicStats() {
  return useQuery({
    queryKey: QK.statsPublic,
    queryFn: () => statsService.listActive(),
    staleTime: APP_CONFIG.cache.contentStaleTime,
  });
}
