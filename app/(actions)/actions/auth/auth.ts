"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { signInSchema, signUpFormSchema } from "@/lib/validations/auth";
import { getPostLoginRedirectPath } from "@/lib/auth/roles";

export type AuthFormState = {
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

const genericAuthError =
  "Bilgileri kontrol edip tekrar deneyin. Sorun devam ederse sifrenizi sifirlayin.";

export async function signInAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Giris bilgileri eksik veya hatali.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { message: genericAuthError };
  }

  revalidatePath("/", "layout");
  redirect(await getPostLoginRedirectPath());
}

export async function signUpAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signUpFormSchema.safeParse({
    displayName: formData.get("displayName"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Uyelik bilgileri eksik veya hatali.",
    };
  }

  const supabase = await createClient();
  const { displayName, email, password, username } = parsed.data;
  const { data: isUsernameAvailable, error: usernameLookupError } =
    await supabase.rpc("is_username_available", {
      check_username: username,
    });

  if (usernameLookupError) {
    return { message: usernameLookupError.message };
  }

  if (!isUsernameAvailable) {
    return {
      errors: {
        username: ["Bu kullanici adi kullaniliyor."],
      },
      message: "Farkli bir kullanici adi secin.",
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        username,
      },
    },
  });

  if (error) {
    return { message: error.message };
  }

  if (!data.session) {
    return {
      message:
        "Uyelik olusturuldu. Devam etmek icin e-posta adresinizi dogrulayin.",
    };
  }

  if (data.user) {
    await supabase
      .from("profiles")
      .update({
        username,
        display_name: displayName,
      })
      .eq("id", data.user.id);
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOutAction() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
