import { useQuery } from "@tanstack/react-query";
import { QK } from "@/core/config/queryKeys";
import { galleryService } from "./gallery.service";

export function usePublicGallery() {
  return useQuery({ queryKey: QK.galleryPublic, queryFn: () => galleryService.listPublic() });
}

export function useAdminGallery() {
  return useQuery({ queryKey: QK.galleryAdmin, queryFn: () => galleryService.listAll() });
}
