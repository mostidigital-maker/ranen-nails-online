import { db, realtime } from "@/core/supabase/db";
import { assertNoError } from "@/core/errors/appError";
import type { Appointment, BlockedSlot, BusinessHours } from "./types";
import type { AppointmentStatus } from "@/shared/types/common";

export const bookingService = {
  /* ----- appointments ----- */
  async listAppointments(): Promise<Appointment[]> {
    const { data, error } = await db.from("appointments").select("*").order("appointment_at", { ascending: true });
    assertNoError(error);
    return (data || []) as unknown as Appointment[];
  },

  async createAppointment(input: {
    client_name: string;
    client_phone: string;
    service_id: string;
    service_name: string;
    service_price: number;
    appointment_at: string;
    notes: string | null;
  }) {
    const { error } = await db.from("appointments").insert(input);
    assertNoError(error);
  },

  async updateStatus(id: string, status: AppointmentStatus) {
    const { error } = await db.from("appointments").update({ status }).eq("id", id);
    assertNoError(error);
  },

  async removeAppointment(id: string) {
    const { error } = await db.from("appointments").delete().eq("id", id);
    assertNoError(error);
  },

  /** Realtime subscription for the admin dashboard. */
  subscribeAppointments(onChange: () => void) {
    const channel = realtime
      .channel("appointments-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, onChange)
      .subscribe();
    return () => { realtime.remove(channel); };
  },

  /* ----- business hours ----- */
  async listHours(): Promise<BusinessHours[]> {
    const { data, error } = await db.from("business_hours").select("*").order("day_of_week");
    assertNoError(error);
    return (data || []) as unknown as BusinessHours[];
  },

  async getHoursForDay(dayOfWeek: number) {
    const { data, error } = await db
      .from("business_hours")
      .select("is_closed,open_time,close_time,slot_step_minutes")
      .eq("day_of_week", dayOfWeek)
      .maybeSingle();
    assertNoError(error);
    return data;
  },

  async updateHours(id: string, patch: Partial<BusinessHours>) {
    const { error } = await db.from("business_hours").update(patch).eq("id", id);
    assertNoError(error);
  },

  /* ----- blocked slots ----- */
  async listUpcomingBlocks(): Promise<BlockedSlot[]> {
    const { data, error } = await db
      .from("blocked_slots")
      .select("*")
      .gte("end_at", new Date().toISOString())
      .order("start_at");
    assertNoError(error);
    return (data || []) as unknown as BlockedSlot[];
  },

  async listBlocksInRange(fromISO: string, toISO: string) {
    const { data, error } = await db
      .from("blocked_slots")
      .select("start_at,end_at")
      .lt("start_at", toISO)
      .gt("end_at", fromISO);
    assertNoError(error);
    return data || [];
  },

  async addBlock(startISO: string, endISO: string, reason: string | null) {
    const { error } = await db.from("blocked_slots").insert({ start_at: startISO, end_at: endISO, reason });
    assertNoError(error);
  },

  async removeBlock(id: string) {
    const { error } = await db.from("blocked_slots").delete().eq("id", id);
    assertNoError(error);
  },

  /** Busy ranges (pending + confirmed appointments) from the DB function. */
  async getBusyRanges(fromISO: string, toISO: string) {
    const { data, error } = await db.rpc("get_busy_ranges", { _from: fromISO, _to: toISO });
    assertNoError(error);
    return (data || []) as Array<{ start_at: string; end_at: string }>;
  },
};
