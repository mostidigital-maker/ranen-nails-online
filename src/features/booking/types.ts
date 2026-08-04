import type { AppointmentStatus } from "@/shared/types/common";

export type Appointment = {
  id: string;
  client_name: string;
  client_phone: string;
  service_id?: string;
  service_name: string;
  service_price: number;
  appointment_at: string;
  status: AppointmentStatus;
  notes: string | null;
};

export type BookingDraft = {
  name: string;
  phone: string;
  serviceId: string;
  date: string;
  time: string;
  notes: string;
};

export type BusinessHours = {
  id: string;
  day_of_week: number;
  is_closed: boolean;
  open_time: string;
  close_time: string;
  slot_step_minutes: number;
};

export type BlockedSlot = {
  id: string;
  start_at: string;
  end_at: string;
  reason: string | null;
};

export type Slot = { value: string; label: string }; // value = "HH:MM"

export type BookingConfig = {
  booking_enabled: boolean;
  booking_max_days_ahead: number;
  booking_min_notice_minutes: number;
  booking_slot_interval_minutes: number;
};
