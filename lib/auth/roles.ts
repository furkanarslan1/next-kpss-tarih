import { createClient } from "@/lib/supabase/server";

export async function getCurrentUserRole() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, isAdmin: false };
  }

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  return {
    user,
    isAdmin: roles?.some((role) => role.role === "admin") ?? false,
  };
}

export async function getPostLoginRedirectPath() {
  const { isAdmin } = await getCurrentUserRole();

  return isAdmin ? "/admin" : "/";
}
