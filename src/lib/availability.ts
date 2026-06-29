import { supabase } from "@/integrations/supabase/client";

export type Slot = { value: string; label: string }; // value = "HH:MM"

function parseHM(s: string): { h: number; m: number } {
  const [h, m] = s.split(":").map(Number);
  return { h, m: m || 0 };
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Compute available start times for `dateStr` (YYYY-MM-DD, local) for a service of `durationMin`.
 * Excludes closed days, past times (if today), existing pending/confirmed appointments and admin blocks.
 */
export async function getAvailableSlots(dateStr: string, durationMin: number): Promise<{ slots: Slot[]; closed: boolean }> {
  if (!dateStr || !durationMin) return { slots: [], closed: false };

  // Build local day range
  const [y, mo, d] = dateStr.split("-").map(Number);
  const dayStart = new Date(y, mo - 1, d, 0, 0, 0, 0);
  const dayEnd = new Date(y, mo - 1, d, 23, 59, 59, 999);
  const dow = dayStart.getDay();

  // 1) hours for this weekday
  const { data: hoursRow, error: hErr } = await supabase
    .from("business_hours")
    .select("is_closed,open_time,close_time,slot_step_minutes")
    .eq("day_of_week", dow)
    .maybeSingle();
  if (hErr) throw hErr;
  if (!hoursRow || hoursRow.is_closed) return { slots: [], closed: true };

  // 2) busy ranges + blocks for this day, in parallel
  const [{ data: busy, error: bErr }, { data: blocks, error: blErr }] = await Promise.all([
    supabase.rpc("get_busy_ranges", { _from: dayStart.toISOString(), _to: dayEnd.toISOString() }),
    supabase.from("blocked_slots").select("start_at,end_at")
      .lt("start_at", dayEnd.toISOString()).gt("end_at", dayStart.toISOString()),
  ]);
  if (bErr) throw bErr;
  if (blErr) throw blErr;

  const busyRanges: Array<[Date, Date]> = [
    ...(busy || []).map((r: { start_at: string; end_at: string }) => [new Date(r.start_at), new Date(r.end_at)] as [Date, Date]),
    ...(blocks || []).map((r) => [new Date(r.start_at), new Date(r.end_at)] as [Date, Date]),
  ];

  const open = parseHM(hoursRow.open_time);
  const close = parseHM(hoursRow.close_time);
  const step = hoursRow.slot_step_minutes || 30;

  const openDt = new Date(y, mo - 1, d, open.h, open.m, 0, 0);
  const closeDt = new Date(y, mo - 1, d, close.h, close.m, 0, 0);
  const now = new Date();

  const slots: Slot[] = [];
  for (let t = new Date(openDt); ; t = new Date(t.getTime() + step * 60000)) {
    const end = new Date(t.getTime() + durationMin * 60000);
    if (end > closeDt) break;
    if (t <= now) continue;
    let busyHit = false;
    for (const [bs, be] of busyRanges) {
      if (overlaps(t, end, bs, be)) { busyHit = true; break; }
    }
    if (busyHit) continue;
    slots.push({
      value: `${pad(t.getHours())}:${pad(t.getMinutes())}`,
      label: `${pad(t.getHours())}:${pad(t.getMinutes())}`,
    });
  }

  return { slots, closed: false };
}
