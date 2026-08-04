import { supabase } from "@/integrations/supabase/client";

/**
 * Single Supabase entry point for the whole application.
 * Feature services import from here; components never import the client
 * directly. This keeps every query in the services layer.
 */
export const db = supabase;

/** Loosely-typed table accessor: some CMS tables are not in generated types. */
export function table(name: string) {
  return supabase.from(name as never);
}

export const storage = supabase.storage;
export const auth = supabase.auth;
export const realtime = {
  channel: (name: string) => supabase.channel(name),
  remove: (channel: Parameters<typeof supabase.removeChannel>[0]) => supabase.removeChannel(channel),
};
