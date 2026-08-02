# Beauty Salon CMS — Generalization Plan

Turn the project into a reusable CMS. No UI redesign, no layout/booking changes, no data loss. All hardcoded "Ranen Nails" content becomes editable from Admin.

## 1. Database migrations (additive only)

Single migration that only ADDs columns/tables. No drops, no renames.

**Extend `site_settings`** (single-row config) with columns:
- General: `business_name`, `business_subtitle`, `logo_url`, `hero_image_url`, `hero_title`, `hero_subtitle`, `about_text` (most already exist — add missing)
- Contact: `phone`, `whatsapp`, `email`, `address`, `google_maps_url`
- Social: `instagram_url`, `facebook_url`, `tiktok_url`, `youtube_url`
- Business: `currency` (default `ILS`), `timezone` (default `Asia/Jerusalem`), `booking_enabled` (bool), `online_payments_enabled` (bool)
- Booking config: `booking_max_days_ahead` (int, default 30), `booking_min_notice_minutes` (int, default 120), `booking_slot_interval_minutes` (int, default 30)
- SEO: `seo_title`, `seo_description`, `seo_keywords`, `favicon_url`, `og_image_url`
- Analytics: `ga_measurement_id`, `gtm_id`, `meta_pixel_id`, `tiktok_pixel_id`, `google_site_verification`
- Payments (config only, no integration): `payments_enabled` (bool), `payments_provider` (text), `payments_public_key`, `payments_secret_key` (nullable — real secrets still go to Supabase secrets), `payments_success_url`, `payments_cancel_url`, `payments_mode` ('sandbox'|'production')

**New table `service_categories`**: `id`, `slug`, `name`, `display_order`, `is_active`, timestamps. Seed with: Nails, Eyebrows, Lashes, Hair, Facial, Waxing, Makeup, Skincare, Other.

**Extend `services`** with: `category_id` (nullable FK → service_categories), `image_url`, `display_order`, `is_active` (add whichever are missing). Keep old `category` text column for backward compat.

**Extend `gallery_items`** with: `category`, `title`, `description`, `is_before_after` (bool), `display_order`, `is_active`.

**Extend `testimonials`** with: `photo_url`, `display_order`, `is_active`.

**Extend `faqs`** with: `display_order`, `is_active` (if missing).

**Extend `stats`** with: `display_order`, `is_active` (if missing).

All new columns nullable or defaulted so existing rows keep working. RLS: reuse existing policies; new `service_categories` gets public SELECT + admin write, matching the pattern in existing tables. Grants included per public-schema rules.

## 2. Remove hardcoded branding

- `src/lib/site.ts` → thin fallback defaults only; real values fetched from `site_settings`.
- `src/routes/__root.tsx` head → read business/SEO from `site_settings` via a public loader server fn (`getPublicSiteSettings`); fallback to defaults if row missing.
- `src/routes/index.tsx`, `SiteHeader`, footer, contact block → consume `site_settings` fields instead of hardcoded strings.
- WhatsApp booking message → uses `site_settings.whatsapp`.
- Auth page + any residual "Ranen Nails" strings → replaced with `business_name`.

## 3. Admin Panel expansion

Keep existing tab structure. Extend/add tabs so every new field is editable. No redesign — same shadcn tabs, cards, inputs, table rows.

Tabs (existing kept, extended as noted):
1. **General** — business name/subtitle/logo/hero/about
2. **Contact & Social** — phone, whatsapp, email, address, maps URL, all social links
3. **Business & Booking** — currency, timezone, booking_enabled, max days ahead, min notice, slot interval
4. **SEO** — title, description, keywords, favicon, og image
5. **Analytics** — GA, GTM, Meta Pixel, TikTok Pixel, Search Console verification (config only)
6. **Payments** — enabled, provider dropdown (Stripe/Tranzila/CardCom/Pelecard/Meshulam/Green Invoice), public key, secret key note (points to secrets), success/cancel URLs, sandbox/production toggle (config only)
7. **Service Categories** — CRUD + reorder + hide
8. **Services** — CRUD, assign category, image, display_order, is_active toggle, drag-free up/down reorder buttons
9. **Gallery** — CRUD with category, title, description, before/after flag, order, active
10. **Testimonials** — CRUD with optional photo upload, order, active
11. **FAQ** — CRUD + reorder + hide
12. **Statistics** — CRUD (title, value, icon name, order, visibility)
13. **Business Hours** (existing) — unchanged
14. **Blocked Slots** (existing) — unchanged
15. **Appointments** (existing) — unchanged

Reorder = simple ▲/▼ buttons updating `display_order`. Visibility = `is_active` switch.

## 4. Booking logic

No behavioral change. `availability.ts` now reads `booking_max_days_ahead`, `booking_min_notice_minutes`, `booking_slot_interval_minutes` from settings (with current values as defaults). Booking form is hidden when `booking_enabled = false`.

## 5. Analytics / PWA / Payments

- Analytics: root route conditionally injects GA/GTM/Meta/TikTok script tags when IDs are set. No SDK code beyond snippet injection.
- PWA: no implementation. Confirm nothing in the codebase blocks a future `manifest.webmanifest` + service worker (it doesn't).
- Payments: config UI only. No provider SDK added.

## 6. Code quality

- New `src/lib/settings.ts` — typed `SiteSettings` + `usePublicSettings()` hook (TanStack Query) + server fn `getPublicSiteSettings`.
- Reusable `<AdminSection>`, `<ReorderRow>`, `<ImageUploadField>` components extracted from existing admin code where duplication exists.
- Keep all existing files; edits are additive.

## Technical notes

- Migration is one file, additive `ALTER TABLE ADD COLUMN IF NOT EXISTS` + `CREATE TABLE IF NOT EXISTS` + grants + RLS + seed of `service_categories`.
- Public settings fetched via server fn (publishable-key client) so SSR head tags work.
- Secret payment keys: UI shows a field but recommends storing via Supabase secrets; DB column exists for non-sensitive keys (public key, provider config).
- No changes to `_authenticated/route.tsx` gate, no changes to auth flow.

## Out of scope (explicit)

- No UI redesign, no color/font/layout changes.
- No payment provider integration.
- No PWA implementation.
- No data migration (schema is additive).
- No removal of existing features.
