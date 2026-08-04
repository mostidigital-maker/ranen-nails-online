import { useQuery } from "@tanstack/react-query";
import { APP_CONFIG } from "@/core/config/app.config";
import { QK } from "@/core/config/queryKeys";
import { servicesService } from "./services.service";
import { categoriesService } from "./categories.service";

export function usePublicServices() {
  return useQuery({
    queryKey: QK.servicesPublic,
    queryFn: () => servicesService.listPublic(),
    staleTime: APP_CONFIG.cache.contentStaleTime,
  });
}

export function useAdminServices() {
  return useQuery({ queryKey: QK.servicesAdmin, queryFn: () => servicesService.listAll() });
}

export function useServiceCategories(activeOnly = true) {
  return useQuery({
    queryKey: QK.categoriesPublic(activeOnly),
    queryFn: () => categoriesService.list(activeOnly),
    staleTime: APP_CONFIG.cache.contentStaleTime,
  });
}

export function useAdminCategories() {
  return useQuery({ queryKey: QK.categoriesAdmin, queryFn: () => categoriesService.list(false) });
}
