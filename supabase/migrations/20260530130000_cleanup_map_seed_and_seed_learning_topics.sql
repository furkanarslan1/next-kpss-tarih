delete from public.historical_periods
where id in (
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000111'
);

insert into public.historical_periods (
  id,
  slug,
  title,
  description,
  starts_at_year,
  ends_at_year,
  display_order,
  status
)
values (
  '00000000-0000-4000-8000-000000000111',
  'osmanli-tarihi',
  'Osmanli Tarihi',
  'Beylikten devlete, devletten imparatorluga uzanan KPSS Osmanli tarihi konulari.',
  1299,
  1922,
  20,
  'published'
);

insert into public.topics (
  id,
  period_id,
  slug,
  title,
  summary,
  map_center,
  display_order,
  status
)
values (
  '00000000-0000-4000-8000-000000000211',
  '00000000-0000-4000-8000-000000000111',
  'osmanli-kurulus-donemi',
  'Osmanli Kurulus Donemi',
  'KPSS icin Osmanli Kurulus Donemi: Osman Bey, Orhan Bey, Rumeliye gecis, Bursa, Edirne, Balkan savaslari, Ankara Savasi, Fetret Devri ve Istanbulun fethine giden surec.',
  '{"lat": 40.7, "lng": 29.8, "zoom": 6}'::jsonb,
  10,
  'published'
);
