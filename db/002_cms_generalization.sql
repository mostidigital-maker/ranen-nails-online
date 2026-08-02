-- ============================================================
-- Beauty Salon CMS — generalization migration (ADDITIVE ONLY)
-- Safe to re-run. No drops, no renames, no data loss.
-- ============================================================

-- ------------------------------------------------------------
-- 1. SITE SETTINGS — new configurable columns
-- ------------------------------------------------------------
alter table public.site_settings add column if not exists brand_latin           text;
alter table public.site_settings add column if not exists email                 text;
alter table public.site_settings add column if not exists facebook_url          text;
alter table public.site_settings add column if not exists tiktok_url            text;
alter table public.site_settings add column if not exists youtube_url           text;

-- Business
alter table public.site_settings add column if not exists currency              text    not null default '₪';
alter table public.site_settings add column if not exists timezone              text    not null default 'Asia/Jerusalem';
alter table public.site_settings add column if not exists booking_enabled       boolean not null default true;
alter table public.site_settings add column if not exists online_payments_enabled boolean not null default false;

-- Booking configuration
alter table public.site_settings add column if not exists booking_max_days_ahead        integer not null default 60;
alter table public.site_settings add column if not exists booking_min_notice_minutes    integer not null default 0;
alter table public.site_settings add column if not exists booking_slot_interval_minutes integer not null default 0; -- 0 = use business_hours step

-- SEO
alter table public.site_settings add column if not exists seo_title       text;
alter table public.site_settings add column if not exists seo_description text;
alter table public.site_settings add column if not exists seo_keywords    text;
alter table public.site_settings add column if not exists favicon_url     text;
alter table public.site_settings add column if not exists og_image_url    text;

-- Analytics (all public-safe identifiers)
alter table public.site_settings add column if not exists ga_measurement_id        text;
alter table public.site_settings add column if not exists gtm_id                   text;
alter table public.site_settings add column if not exists meta_pixel_id            text;
alter table public.site_settings add column if not exists tiktok_pixel_id          text;
alter table public.site_settings add column if not exists google_site_verification text;

-- Payments (configuration only — no provider integration)
alter table public.site_settings add column if not exists payments_enabled     boolean not null default false;
alter table public.site_settings add column if not exists payments_provider    text    not null default 'none';
alter table public.site_settings add column if not exists payments_public_key  text;
alter table public.site_settings add column if not exists payments_success_url text;
alter table public.site_settings add column if not exists payments_cancel_url  text;
alter table public.site_settings add column if not exists payments_mode        text    not null default 'sandbox';

-- ------------------------------------------------------------
-- 2. SECURE SETTINGS — admin-only key/value (never public)
--    Used for payment secret keys etc. NOT readable by anon.
-- ------------------------------------------------------------
create table if not exists public.secure_settings (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.secure_settings to authenticated;
grant all on public.secure_settings to service_role;

alter table public.secure_settings enable row level security;

drop policy if exists "secure_settings admin all" on public.secure_settings;
create policy "secure_settings admin all"
  on public.secure_settings for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ------------------------------------------------------------
-- 3. SERVICE CATEGORIES
-- ------------------------------------------------------------
create table if not exists public.service_categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  name_ar    text not null,
  name_he    text not null,
  sort_order integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

grant select on public.service_categories to anon;
grant select, insert, update, delete on public.service_categories to authenticated;
grant all on public.service_categories to service_role;

alter table public.service_categories enable row level security;

drop policy if exists "service_categories public read" on public.service_categories;
create policy "service_categories public read"
  on public.service_categories for select
  to anon, authenticated
  using (true);

drop policy if exists "service_categories admin write" on public.service_categories;
create policy "service_categories admin write"
  on public.service_categories for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

insert into public.service_categories (slug, name_ar, name_he, sort_order) values
  ('nails',     'أظافر',        'ציפורניים', 1),
  ('eyebrows',  'حواجب',        'גבות',      2),
  ('lashes',    'رموش',         'ריסים',     3),
  ('hair',      'شعر',          'שיער',      4),
  ('facial',    'عناية بالوجه', 'טיפוח פנים',5),
  ('waxing',    'إزالة الشعر',  'הסרת שיער', 6),
  ('makeup',    'مكياج',        'איפור',     7),
  ('skincare',  'عناية بالبشرة','טיפוח עור', 8),
  ('other',     'أخرى',         'אחר',       9)
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- 4. SERVICES — category + image
-- ------------------------------------------------------------
alter table public.services add column if not exists category_id uuid references public.service_categories(id) on delete set null;
alter table public.services add column if not exists image_url   text;
create index if not exists services_category_id_idx on public.services (category_id);

-- ------------------------------------------------------------
-- 5. GALLERY ITEMS — category / title / description / before-after
-- ------------------------------------------------------------
alter table public.gallery_items add column if not exists category         text;
alter table public.gallery_items add column if not exists title            text;
alter table public.gallery_items add column if not exists description      text;
alter table public.gallery_items add column if not exists is_before_after  boolean not null default false;

-- ------------------------------------------------------------
-- 6. TESTIMONIALS — optional photo
-- ------------------------------------------------------------
alter table public.testimonials add column if not exists photo_url text;

-- ------------------------------------------------------------
-- 7. Safety: ensure ordering/visibility columns exist everywhere
-- ------------------------------------------------------------
alter table public.faqs         add column if not exists sort_order integer not null default 0;
alter table public.faqs         add column if not exists is_active  boolean not null default true;
alter table public.stats        add column if not exists sort_order integer not null default 0;
alter table public.stats        add column if not exists is_active  boolean not null default true;
alter table public.testimonials add column if not exists sort_order integer not null default 0;
alter table public.testimonials add column if not exists is_active  boolean not null default true;
