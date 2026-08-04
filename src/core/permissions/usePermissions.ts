import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { anyRoleCan, type Permission, type Role, ROLES } from "./roles";

/** Reads the roles granted to the signed-in user from `user_roles`. */
export async function fetchCurrentRoles(): Promise<Role[]> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return [];
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
  if (error) return [];
  return (data || [])
    .map((r) => r.role as Role)
    .filter((r): r is Role => (ROLES as readonly string[]).includes(r));
}

export function usePermissions() {
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["current-user-roles"],
    queryFn: fetchCurrentRoles,
    staleTime: 60_000,
  });

  return {
    roles,
    isLoading,
    isAdmin: roles.includes("admin"),
    can: (permission: Permission) => anyRoleCan(roles, permission),
  };
}
