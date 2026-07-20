# Premium UX Upgrade + Full CMS

Keep current rose/gold theme, RTL, Arabic-first with Hebrew toggle, booking logic, gallery uploads. Only enhance UX and make everything editable from Admin.

## 1. Database (single migration)

New tables (all with `GRANT` + RLS: public SELECT active rows, admin full CRUD):

- `site_settings` — key/value JSONB store (single-row config): business_name_ar/he, logo_url, hero_title_ar/he, hero_subtitle_ar/he, about_text_ar/he, phone, whatsapp, instagram, address_ar/he, maps_url, working_hours_text_ar/he, footer_text_ar/he, button labels.
- `stats` — id, label_ar, label_he, value (int), suffix, sort_order, is_active.
- `about_cards` — id, icon (lucide name), title_ar/he, text_ar/he, sort_order, is_active.
- `testimonials` — id, name, text_ar, text_he, rating (1–5), sort_order, is_active.
- `faqs` — id, question_ar/he, answer_ar/he, sort_order, is_active.

Extend `services`: add `description_ar`, `description_he` (text, nullable).

Seed with current hardcoded values so nothing regresses.

## 2. Frontend

Install `framer-motion`.

Restructure `src/routes/index.tsx` into sections powered by DB:
- **Hero**: title + subtitle from settings, two CTAs (Book / Gallery), reserved image slot (uses `settings.hero_image_url` if present, else gradient placeholder). Subtle fade-up motion.
- **Stats**: animated count-up on scroll (framer-motion `useInView` + tween).
- **About**: intro text + grid of `about_cards` (icon + title + text).
- **Services**: cards with description, duration, price, "Book" button (scrolls to booking with service preselected), hover lift.
- **Gallery**: existing data + `yet-another-react-lightbox` for lightbox.
- **Testimonials**: card carousel/grid with star rating.
- **FAQ**: shadcn Accordion.
- **Booking**: unchanged logic; polished spacing/typography.
- **Contact**: phone/whatsapp/instagram/address/hours/navigate button, all from settings.
- **Footer**: from settings.

Motion used sparingly: section fade-up on enter, hover scale on cards, stat count-up.

## 3. Admin (`/admin`)

Add tabs: Settings, Stats, About Cards, Testimonials, FAQ. Extend Services with description + drag-reorder (up/down arrow buttons — simple, no DnD lib). Keep Appointments, Services, Gallery, Hours, Blocks.

Each new panel: list + inline add/edit form + delete + up/down reorder + active toggle.

Settings panel: single form editing the `site_settings` row (all text fields, both languages, logo upload to gallery bucket).

## 4. i18n

Add keys for new UI labels (stats, testimonials, FAQ, contact, footer, admin panel labels).

## Technical notes
- Public `SELECT` policies scoped to `is_active = true` for anon; admin gets full access via `has_role`.
- `site_settings` uses a fixed singleton row (id = 1); public anon SELECT allowed.
- Reorder = `UPDATE ... SET sort_order` via two-row swap.
- Count-up: framer-motion `animate(count, target)` inside `useInView`.
- Lightbox: `yet-another-react-lightbox` (small, RTL-friendly).
- No booking-flow changes; service "Book" button just sets form state + scrolls.

Ready to build?
