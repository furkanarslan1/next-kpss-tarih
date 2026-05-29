# Supabase Kurulum Notlari

Bu dosya Next KPSS Tarih projesinin Supabase kararlarini ve tekrar uygulanabilir komutlarini tutar.

## Paketler

Resmi Supabase Next.js SSR rehberi `@supabase/supabase-js` ve `@supabase/ssr` paketlerini oneriyor. Bu projede ayrica form validasyonu icin `zod` eklendi.

```bash
pnpm add @supabase/supabase-js @supabase/ssr zod --store-dir /Users/furkanarslan/Library/pnpm/store/v10
pnpm add -D supabase --store-dir /Users/furkanarslan/Library/pnpm/store/v10
```

CLI paketi DNS yuzunden yarida kalirsa ikinci komutu sen calistirabilirsin.

## Environment

`.env.local` dosyasi commitlenmez. Supabase yeni key sisteminde publishable key kullanacagiz:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
# Geriye uyumluluk icin mevcut projede bu ad da desteklenir:
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
```

Server-only service role/secret key istemci kodunda kullanilmayacak. Gerekirse yalnizca Route Handler veya Server Action icinde, RLS bypass gerektiren cok sinirli admin isleri icin ayri deger olarak tutulacak.

## CLI Akisi

```bash
pnpm supabase login
pnpm supabase link --project-ref PROJECT_REF
pnpm supabase db push
pnpm supabase gen types typescript --linked > lib/supabase/database.types.ts
```

Local Supabase ile calismak icin:

```bash
pnpm supabase start
pnpm supabase db reset
```

## Auth Kararlari

- Next.js 16 `proxy.ts` kullaniliyor; `middleware.ts` kullanilmadi.
- Server tarafinda session korumasi icin `getClaims()` guvenilecek kontrol noktasi olarak kullanilacak.
- Kullanici kaydolunca `profiles` kaydi ve `member` rolu trigger ile olusur.
- Ilk admin bootstrap'i icin once kullanici normal sign up olur, sonra Supabase SQL editor ya da service role ile:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where email = 'admin@example.com'
on conflict (user_id, role) do nothing;
```

## Sema Ozeti

- `profiles`: auth user profil bilgileri.
- `user_roles`: `admin`, `editor`, `member` rolleri.
- `historical_periods`: Islamiyet oncesi Turk tarihi gibi ana donemler.
- `topics`: Asya Hun Devleti gibi konu sayfalari.
- `historical_entities`: devlet, kisi, yer, antlasma gibi tarihsel varliklar.
- `map_layers`: haritada cizilecek GeoJSON katmanlari.
- `timeline_events`: tarih veya tarih araligina bagli olaylar.
- `event_locations`: olaylarin harita ustunde tiklanabilir nokta/bolge kayitlari.
- `flashcards`: konu bilgi kartlari.
- `quiz_questions`, `quiz_options`: coktan secmeli testler.
- `quiz_attempts`, `quiz_attempt_answers`: kullanici test gecmisi.
- `user_flashcard_reviews`: kullanicinin kart tekrar durumu.

## RLS Stratejisi

- Yayindaki icerik `anon` ve `authenticated` kullanicilara okunabilir.
- Taslak/arsiv icerik sadece admin tarafindan gorulur ve yonetilir.
- Kullanici kendi profilini, test denemelerini ve kart tekrarlarini yonetir.
- Roller yalnizca admin tarafindan yonetilir.
- `private.is_admin(auth.uid())` ve `private.has_role(...)` fonksiyonlari RLS icinde tekrar eden rol kontrolunu merkezilestirir. Bu fonksiyonlar public API schema disina alindi; RPC olarak expose edilmez.

## Harita Verisi Notu

Bolge, rota ve savas cepheleri icin `map_layers.geojson` kullanilacak. Tekil olay konumlari icin `event_locations.lat/lng`, bolgesel olaylar icin `event_locations.geojson` desteklenir. Bu sayede bir konu secildiginde zaman filtresine gore hem katmanlar hem de modal acan olay isaretleri birlikte getirilebilir.

## Kaynak Notlari

- Supabase resmi SSR rehberi, Next.js icin `@supabase/ssr` ve cookie tabanli client kullanimini oneriyor.
- Supabase dokumani yeni publishable key sistemini oneriyor; eski `anon` key 2026 sonuna kadar calissa da yeni projede `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` tercih edildi.
- Next.js 16 yerel dokumaninda proxy dosya konvansiyonu ve Server Actions icinde auth/authorization kontrolu vurgulaniyor.
