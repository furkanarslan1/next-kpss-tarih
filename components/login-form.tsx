"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  signInAction,
  type AuthFormState,
} from "@/app/(actions)/actions/auth/auth";
import { cn } from "@/lib/utils";
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

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, formAction, pending] = useActionState(
    signInAction,
    initialState,
  );

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Hesabina giris yap</CardTitle>
          <CardDescription>
            KPSS Tarih harita calismalarina devam etmek icin giris yap.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <FieldGroup>
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
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Sifre</FieldLabel>
                  <Link
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Sifremi unuttum
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
                <FieldError
                  errors={state.errors?.password?.map((message) => ({
                    message,
                  }))}
                />
              </Field>
              {state.message ? <FieldError>{state.message}</FieldError> : null}
              <Field>
                <Button type="submit" disabled={pending}>
                  {pending ? "Giris yapiliyor..." : "Giris yap"}
                </Button>
                <FieldDescription className="text-center">
                  Hesabin yok mu? <Link href="/signup">Uye ol</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
