-- ============================================================
-- Template upgrades (ADDITIVE ONLY — safe to re-run).
-- Run in Supabase → SQL Editor BEFORE deploying the new code.
-- ============================================================
alter table public.site_settings add column if not exists theme_preset     text    not null default 'rose';
alter table public.site_settings add column if not exists rating_value     numeric(2,1) default 5.0;
alter table public.site_settings add column if not exists reviews_count    integer default 0;
alter table public.site_settings add column if not exists reviews_url      text;
alter table public.site_settings add column if not exists waze_url         text;
alter table public.site_settings add column if not exists notice_enabled   boolean not null default false;
alter table public.site_settings add column if not exists notice_title_ar  text;
alter table public.site_settings add column if not exists notice_title_he  text;
alter table public.site_settings add column if not exists notice_text_ar   text;
alter table public.site_settings add column if not exists notice_text_he   text;
