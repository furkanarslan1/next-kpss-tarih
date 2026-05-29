import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentUserRole } from "@/lib/auth/roles";

export default async function LoginPage() {
  const { user, isAdmin } = await getCurrentUserRole();

  if (user) {
    redirect(isAdmin ? "/admin" : "/");
  }

  return <LoginForm />;
}
