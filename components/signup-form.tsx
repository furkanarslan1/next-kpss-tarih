"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  signUpAction,
  type AuthFormState,
} from "@/app/(actions)/actions/auth/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const initialState: AuthFormState = {};

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const [state, formAction, pending] = useActionState(
    signUpAction,
    initialState,
  );

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Hesap olustur</CardTitle>
        <CardDescription>
          Harita uzerinde tarih calismaya baslamak icin bilgilerini gir.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="displayName">Ad soyad</FieldLabel>
              <Input
                id="displayName"
                name="displayName"
                type="text"
                placeholder="Furkan Arslan"
                autoComplete="name"
                required
              />
              <FieldError
                errors={state.errors?.displayName?.map((message) => ({
                  message,
                }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">E-posta</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ornek@mail.com"
                autoComplete="email"
                required
              />
              <FieldError
                errors={state.errors?.email?.map((message) => ({ message }))}
              />
              <FieldDescription>
                Giriş ve hesap güvenliği için kullanılacak.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="username">Kullanici adi</FieldLabel>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="furkan_arslan"
                autoComplete="username"
                required
              />
              <FieldError
                errors={state.errors?.username?.map((message) => ({
                  message,
                }))}
              />
              <FieldDescription>
                Leaderboardda bu isim gorunecek. Harf, rakam ve alt cizgi kullan.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Sifre</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
              />
              <FieldError
                errors={state.errors?.password?.map((message) => ({
                  message,
                }))}
              />
              <FieldDescription>
                En az 8 karakter, harf ve rakam icermeli.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">Sifre tekrari</FieldLabel>
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
              />
              <FieldError
                errors={state.errors?.confirmPassword?.map((message) => ({
                  message,
                }))}
              />
            </Field>
            {state.message ? <FieldError>{state.message}</FieldError> : null}
            <FieldGroup>
              <Field>
                <Button type="submit" disabled={pending}>
                  {pending ? "Hesap olusturuluyor..." : "Hesap olustur"}
                </Button>
                <FieldDescription className="px-6 text-center">
                  Zaten hesabin var mi? <Link href="/login">Giris yap</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
