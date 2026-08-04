import { useQuery } from "@tanstack/react-query";
import { APP_CONFIG } from "@/core/config/app.config";
import { QK } from "@/core/config/queryKeys";
import { bookingService } from "./booking.service";
import { getAvailableSlots } from "./availability";

export function useAppointments() {
  return useQuery({ queryKey: QK.appointments, queryFn: () => bookingService.listAppointments() });
}

export function useBusinessHours() {
  return useQuery({ queryKey: QK.businessHours, queryFn: () => bookingService.listHours() });
}

export function useBlockedSlots() {
  return useQuery({ queryKey: QK.blockedSlots, queryFn: () => bookingService.listUpcomingBlocks() });
}

export function useAvailableSlots(date: string, duration: number) {
  return useQuery({
    queryKey: QK.slots(date, duration),
    queryFn: () => getAvailableSlots(date, duration),
    enabled: !!date && !!duration,
    staleTime: APP_CONFIG.cache.slotsStaleTime,
  });
}
