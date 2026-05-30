import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Admin paneli</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Next KPSS Tarih
        </h1>
      </section>

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
          <Button asChild className="mt-4" size="sm">
            <Link href="/admin/flashcards">Bilgi kartlarina git</Link>
          </Button>
        </div>
      </section>

      <section className="min-h-96 rounded-lg border bg-muted/30 p-4">
        <h2 className="font-medium">Yayin hazirligi</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Bir sonraki adimda bu alana donem, konu, harita katmani ve soru CRUD
          ekranlarini baglayacagiz.
        </p>
      </section>
    </div>
  );
}
