import { redirect } from "next/navigation";
import { signOutAction } from "@/app/(actions)/actions/auth/auth";
import { Button } from "@/components/ui/button";
import { getCurrentUserRole } from "@/lib/auth/roles";

export default async function AdminPage() {
  const { user, isAdmin } = await getCurrentUserRole();

  if (!user) {
    redirect("/login");
  }

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Admin paneli</p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Next KPSS Tarih
            </h1>
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="outline">
              Cikis yap
            </Button>
          </form>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <h2 className="font-medium">Icerik</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Donemler, konular ve harita katmanlari burada yonetilecek.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h2 className="font-medium">Testler</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Coktan secmeli sorular ve secenekler admin tarafindan girilecek.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h2 className="font-medium">Bilgi kartlari</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Konu tekrar kartlari yayin durumuna gore hazirlanacak.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
