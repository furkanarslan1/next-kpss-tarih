import { redirect } from "next/navigation";
import { SignupForm } from "@/components/signup-form";
import { getCurrentUserRole } from "@/lib/auth/roles";

export default async function SignupPage() {
  const { user, isAdmin } = await getCurrentUserRole();

  if (user) {
    redirect(isAdmin ? "/admin" : "/");
  }

  return <SignupForm />;
}
