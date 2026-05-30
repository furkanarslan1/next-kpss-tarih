import Link from "next/link";
import { signOutAction } from "@/app/(actions)/actions/auth/auth";
import { Button } from "@/components/ui/button";
import { getCurrentUserRole } from "@/lib/auth/roles";

export default async function Home() {
  const { user, isAdmin } = await getCurrentUserRole();

  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-10">
        <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Kullanici anasayfasi
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Next KPSS Tarih
            </h1>
          </div>
          <div className="flex gap-2">
            {user ? (
              <>
                {isAdmin ? (
                  <Button asChild variant="outline">
                    <Link href="/admin">Admin</Link>
                  </Button>
                ) : null}
                <form action={signOutAction}>
                  <Button type="submit" variant="outline">
                    Cikis yap
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link href="/login">Giris yap</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Uye ol</Link>
                </Button>
              </>
            )}
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <h2 className="font-medium">Harita ile konu ogren</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Donem, konu ve tarih araligina gore olaylari haritada goreceksin.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h2 className="font-medium">Test coz</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Konu bitince coktan secmeli sorularla kendini deneyeceksin.
            </p>
          </div>
          <Link
            href={user ? "/flashcards" : "/login"}
            className="rounded-lg border p-4 transition-colors hover:bg-muted/40"
          >
            <h2 className="font-medium">Bilgi kartlari</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sinav oncesi kisa tekrarlar icin kartlari kaydiracaksin.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}
