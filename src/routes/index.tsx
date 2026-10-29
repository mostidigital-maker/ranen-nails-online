import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { useLang } from "@/lib/i18n";
import { SiteHeader } from "@/components/SiteHeader";
import { Reveal, CountUp, SectionHeader } from "@/components/SectionReveal";
import {
  MapPin, Clock, Phone, Sparkles, Calendar, CheckCircle2, ChevronDown,
  Heart, ShieldCheck, Star, MessageCircle, Instagram, Navigation, ImageIcon, Award, Users, Car, Megaphone,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

import { QK } from "@/core/config/queryKeys";
import { reportError, reportSuccess } from "@/core/errors/appError";
import { useSiteSettings } from "@/features/settings/hooks";
import { siteSettingsService } from "@/features/settings/siteSettings.service";
import { usePublicServices, useServiceCategories } from "@/features/services/hooks";
import type { PublicService } from "@/features/services/types";
import { usePublicGallery } from "@/features/gallery/hooks";
import { usePublicStats } from "@/features/stats/stats.service";
import { usePublicAboutCards } from "@/features/about/about.service";
import { usePublicTestimonials } from "@/features/testimonials/testimonials.service";
import { usePublicFaqs } from "@/features/faq/faq.service";
import { bookingService } from "@/features/booking/booking.service";
import { useAvailableSlots } from "@/features/booking/hooks";
import { whatsappService, whatsappTemplates } from "@/features/notifications/whatsapp.service";
import { pickLang } from "@/shared/utils/localized";
import { combineDateTime, todayISODate } from "@/shared/utils/datetime";
import { firstError, isFutureDate, requireFields } from "@/shared/validation/validators";

export const Route = createFileRoute("/")({
  // Settings are read on the server too, so link previews (WhatsApp, Google)
  // show the salon's real name, description and image instead of generic text.
  loader: async () => {
    try {
      return { seo: await siteSettingsService.get() };
    } catch {
      return { seo: null };
    }
  },
  head: ({ loaderData }) => {
    const s = loaderData?.seo;
    const title = s?.seo_title || (s ? `${s.business_name_ar} | احجزي موعدك أونلاين` : "احجزي موعدك أونلاين | صالون التجميل");
    const description =
      s?.seo_description || s?.hero_subtitle_ar || "خدمات العناية والتجميل مع إمكانية حجز المواعيد أونلاين. تصفحي الخدمات والأسعار والمعرض.";
    const image = s?.og_image_url || s?.hero_image_url || null;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
      ],
    };
  },
  component: Index,
});


type Service = PublicService;



// Small map of allowed icon names → components (admin picks a name)
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles, ShieldCheck, Heart, Star, Award, Users, Clock, Phone, MapPin, Calendar, Instagram,
};
function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = ICONS[name] || Sparkles;
  return <Cmp className={className} />;
}

function Index() {
  const { t, lang } = useLang();
  const { data: settings } = useSiteSettings();
  const [preselectedService, setPreselectedService] = useState<string>("");

  const { data: services = [] } = usePublicServices();


  function bookService(id: string) {
    setPreselectedService(id);
    setTimeout(() => {
      document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
    }, 30);
  }

  const bizName = settings ? (lang === "ar" ? settings.business_name_ar : settings.business_name_he) : t("brand");
  const tagline = settings ? (lang === "ar" ? settings.tagline_ar : settings.tagline_he) : t("tagline");
  const address = settings ? (lang === "ar" ? settings.address_ar : settings.address_he) : t("location");

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main>
        <HeroSection bizName={bizName} tagline={tagline} address={address} />
        <StatsSection />
        <AboutSection />
        <ServicesSection services={services} onBook={bookService} />
        <GallerySection />
        <TestimonialsSection />
        <FaqSection />
        {settings?.booking_enabled !== false && (
          <BookingForm services={services} preselectedId={preselectedService} onConsumePreselect={() => setPreselectedService("")} />
        )}
        <ContactSection />
      </main>
      <SiteFooter />
      {settings?.booking_enabled !== false && <FloatingBookButton />}
    </div>
  );
}


/* ---------------- HERO (profile-style) ---------------- */
function HeroSection({ bizName, tagline, address }: { bizName: string; tagline: string; address: string }) {
  const { t, lang } = useLang();
  const { data: settings } = useSiteSettings();
  const title = settings ? (lang === "ar" ? settings.hero_title_ar : settings.hero_title_he) : bizName;
  const subtitle = settings ? (lang === "ar" ? settings.hero_subtitle_ar : settings.hero_subtitle_he) : tagline;
  const heroImage = settings?.hero_image_url;
  const logo = settings?.logo_url;
  const bookingOn = settings?.booking_enabled !== false;

  const phoneDigits = (settings?.phone || "").replace(/\D/g, "");
  const ig = settings?.instagram || "";
  const igHref = ig ? (ig.startsWith("http") ? ig : `https://instagram.com/${ig.replace(/^@/, "")}`) : "";
  const mapsHref = settings?.maps_url || (address ? `https://maps.google.com/?q=${encodeURIComponent(address)}` : "");
  const wazeHref = settings?.waze_url || (address ? `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes` : "");
  const rating = settings?.rating_value ?? 5;
  const reviewsCount = settings?.reviews_count ?? 0;
  const noticeTitle = settings ? (lang === "ar" ? settings.notice_title_ar : settings.notice_title_he) : "";
  const noticeText = settings ? (lang === "ar" ? settings.notice_text_ar : settings.notice_text_he) : "";
  const showNotice = !!settings?.notice_enabled && !!(noticeTitle || noticeText);

  const actions = [
    { icon: Phone, label: t("callNow"), href: phoneDigits ? `tel:${phoneDigits}` : "" },
    { icon: MessageCircle, label: t("whatsapp"), href: settings?.whatsapp ? `https://wa.me/${settings.whatsapp}` : "" },
    { icon: Instagram, label: t("instagram"), href: igHref },
    { icon: Car, label: t("waze"), href: wazeHref },
    { icon: Navigation, label: t("navigate"), href: mapsHref },
  ].filter((a) => a.href);

  return (
    <section className="pb-6 md:px-4 md:pt-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-3xl overflow-hidden bg-card md:rounded-[2rem] md:border md:border-border"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* Cover */}
        <div className="relative h-56 w-full overflow-hidden bg-muted md:h-80">
          {heroImage ? (
            <img src={heroImage} alt={bizName} fetchPriority="high" decoding="async" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
              <Sparkles className="h-16 w-16 text-white/70" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
        </div>

        <div className="relative px-5 pb-7 md:px-9">
          {/* Logo + rating */}
          <div className="-mt-12 mb-4 flex items-end justify-between md:-mt-14">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-card shadow-lg md:h-28 md:w-28">
              {logo ? (
                <img src={logo} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
                  <Sparkles className="h-9 w-9 text-white" />
                </div>
              )}
            </div>
            {(() => {
              const inner = (
                <>
                  <Star className="h-4 w-4 fill-gold text-gold" />
                  {rating.toFixed(1)}
                  <span className="text-xs font-medium text-muted-foreground">
                    {reviewsCount > 0 ? `${reviewsCount} ${t("reviewsWord")}` : lang === "ar" ? "تقييم العميلات" : "דירוג לקוחות"}
                  </span>
                </>
              );
              const cls = "mb-1 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-bold";
              return settings?.reviews_url ? (
                <a href={settings.reviews_url} target="_blank" rel="noreferrer" className={cls + " underline-offset-4 hover:underline"}>{inner}</a>
              ) : (
                <div className={cls}>{inner}</div>
              );
            })()}
          </div>

          {/* Title */}
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{bizName}</div>
          <h1 className="mt-1 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 max-w-xl text-base leading-relaxed text-muted-foreground">{subtitle}</p>}
          {address && (
            <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{address}</span>
            </div>
          )}

          {/* Quick actions */}
          {actions.length > 0 && (
            <div className="mt-6 grid gap-2.5" style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }}>
              {actions.map((a) => {
                const Cmp = a.icon;
                return (
                  <a
                    key={a.label}
                    href={a.href}
                    target={a.href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    className="flex flex-col items-center gap-1.5 rounded-2xl bg-secondary px-1 py-3.5 text-[11px] font-semibold sm:text-xs transition hover:bg-primary/10 hover:text-primary active:scale-95"
                  >
                    <Cmp className="h-5 w-5" />
                    {a.label}
                  </a>
                );
              })}
            </div>
          )}

          {/* CTAs */}
          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            {bookingOn && (
              <motion.a
                whileTap={{ scale: 0.98 }}
                href="#booking"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-7 py-4 font-bold text-background shadow-lg"
              >
                <Calendar className="h-5 w-5" />
                {t("bookNow")}
              </motion.a>
            )}
            <motion.a
              whileTap={{ scale: 0.98 }}
              href="#gallery"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-4 font-bold transition hover:border-primary hover:text-primary"
            >
              <ImageIcon className="h-5 w-5" />
              {t("viewGallery")}
            </motion.a>
          </div>

          {showNotice && (
            <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="mb-1.5 flex items-center gap-2 text-sm font-bold text-primary">
                <Megaphone className="h-4 w-4" />
                {noticeTitle || t("businessNotice")}
              </div>
              {noticeText && <p className="whitespace-pre-line text-sm leading-relaxed">{noticeText}</p>}
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}

/* ---------------- FLOATING BOOK BUTTON ---------------- */
function FloatingBookButton() {
  const { t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [bookingVisible, setBookingVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = document.getElementById("booking");
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setBookingVisible(entry.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const show = scrolled && !bookingVisible;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4"
        >
          <a
            href="#booking"
            className="pointer-events-auto inline-flex items-center gap-2.5 rounded-full bg-foreground px-8 py-4 font-bold text-background shadow-2xl transition active:scale-95"
          >
            {t("bookNow")}
            <Calendar className="h-5 w-5" />
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- STATS ---------------- */
function StatsSection() {
  const { lang } = useLang();
  const { data = [] } = usePublicStats();

  if (!data.length) return null;
  return (
    <section className="px-4 py-14">
      <div className="mx-auto max-w-5xl rounded-3xl border border-border bg-card/70 p-8 shadow-sm backdrop-blur">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {data.map((s, i) => (
            <Reveal key={s.id} delay={i * 0.08} className="text-center">
              <div className="text-4xl md:text-5xl font-black bg-clip-text text-transparent"
                   style={{ backgroundImage: "var(--gradient-primary)" }}>
                <CountUp to={s.value} suffix={s.suffix} />
              </div>
              <div className="mt-2 text-sm font-medium text-muted-foreground">
                {lang === "ar" ? s.label_ar : s.label_he}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- ABOUT ---------------- */
function AboutSection() {
  const { t, lang } = useLang();
  const { data: settings } = useSiteSettings();
  const { data = [] } = usePublicAboutCards();

  const title = settings ? (lang === "ar" ? settings.about_title_ar : settings.about_title_he) : t("about");
  const text = settings ? (lang === "ar" ? settings.about_text_ar : settings.about_text_he) : t("aboutText");
  return (
    <section id="about" className="px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <SectionHeader title={title} />
        <Reveal>
          <p className="mx-auto max-w-2xl text-center text-muted-foreground leading-relaxed">{text}</p>
        </Reveal>
        {data.length > 0 && (
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {data.map((c, i) => (
              <Reveal key={c.id} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="group h-full rounded-3xl border border-border bg-card p-6 text-center shadow-sm transition hover:border-primary hover:shadow-lg"
                >
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition group-hover:scale-110"
                       style={{ background: "var(--gradient-primary)" }}>
                    <Icon name={c.icon} className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold">{lang === "ar" ? c.title_ar : c.title_he}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {lang === "ar" ? c.text_ar : c.text_he}
                  </p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------- SERVICES ---------------- */
function ServicesSection({ services, onBook }: { services: Service[]; onBook: (id: string) => void }) {
  const { t, lang } = useLang();
  const { data: settings } = useSiteSettings();
  const { data: categories = [] } = useServiceCategories();
  const [activeCat, setActiveCat] = useState<string>("");
  const currency = settings?.currency || t("currency");

  // Only categories that actually have services attached
  const usedCategories = useMemo(
    () => categories.filter((c) => services.some((s) => s.category_id === c.id)),
    [categories, services],
  );
  const shown = useMemo(
    () => (activeCat ? services.filter((s) => s.category_id === activeCat) : services),
    [services, activeCat],
  );

  if (!services.length) return null;
  return (
    <section id="services" className="px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <SectionHeader title={t("services")} subtitle={t("servicesSubtitle")} />

        {usedCategories.length > 1 && (
          <Reveal>
            <div className="mb-8 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setActiveCat("")}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${activeCat === "" ? "border-transparent text-primary-foreground shadow" : "border-border bg-card hover:border-primary hover:text-primary"}`}
                style={activeCat === "" ? { background: "var(--gradient-primary)" } : undefined}
              >
                {lang === "ar" ? "الكل" : "הכל"}
              </button>
              {usedCategories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${activeCat === c.id ? "border-transparent text-primary-foreground shadow" : "border-border bg-card hover:border-primary hover:text-primary"}`}
                  style={activeCat === c.id ? { background: "var(--gradient-primary)" } : undefined}
                >
                  {lang === "ar" ? c.name_ar : c.name_he}
                </button>
              ))}
            </div>
          </Reveal>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          {shown.map((s, i) => (
            <Reveal key={s.id} delay={i * 0.06}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="group flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition hover:border-primary hover:shadow-xl"
              >
                {s.image_url && (
                  <img src={s.image_url} alt={lang === "ar" ? s.name_ar : s.name_he} loading="lazy"
                       className="h-40 w-full object-cover transition duration-500 group-hover:scale-105" />
                )}
                <div className="flex h-full flex-col justify-between p-6">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-bold">{lang === "ar" ? s.name_ar : s.name_he}</h3>
                      <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {s.duration_minutes} {t("minutes")}
                      </div>
                    </div>
                    <div className="shrink-0 text-end">
                      <div className="text-3xl font-black bg-clip-text text-transparent"
                           style={{ backgroundImage: "var(--gradient-primary)" }}>
                        {s.price}
                      </div>
                      <div className="text-xs text-muted-foreground">{currency}</div>
                    </div>
                  </div>
                  {(s.description_ar || s.description_he) && (
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {lang === "ar" ? (s.description_ar || "") : (s.description_he || "")}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onBook(s.id)}
                  className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-border bg-background py-2.5 text-sm font-bold transition group-hover:border-transparent group-hover:text-primary-foreground"
                  style={{ backgroundImage: "linear-gradient(var(--card), var(--card))" }}
                >
                  <span className="transition group-hover:hidden">
                    <Calendar className="inline h-4 w-4 me-1" /> {t("bookNow")}
                  </span>
                  <span
                    className="hidden rounded-lg px-4 py-1 text-primary-foreground group-hover:inline-flex group-hover:items-center group-hover:gap-2"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <Calendar className="h-4 w-4" /> {t("bookNow")}
                  </span>
                </button>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ---------------- GALLERY ---------------- */
function GallerySection() {
  const { t } = useLang();

  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  const { data = [] } = usePublicGallery();


  if (!data.length) return null;

  const slides = data.map((it) =>
    it.media_type === "video"
      ? { type: "video" as const, sources: [{ src: it.media_url, type: "video/mp4" }], description: it.caption || "" }
      : { src: it.media_url, description: it.caption || "" }
  );

  return (
    <section id="gallery" className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <SectionHeader title={t("gallery")} />
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {data.map((it, i) => (
            <Reveal key={it.id} delay={i * 0.04}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => { setIdx(i); setOpen(true); }}
                className="group relative block aspect-square w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
              >
                {it.media_type === "video" ? (
                  <>
                    <video src={it.media_url} muted playsInline className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="rounded-full bg-white/90 p-3"><Sparkles className="h-5 w-5 text-primary" /></div>
                    </div>
                  </>
                ) : (
                  <img src={it.media_url} alt={it.caption || ""} loading="lazy"
                       className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                {it.caption && (
                  <div className="absolute inset-x-0 bottom-0 translate-y-2 p-3 text-xs text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100" dir="rtl">
                    {it.caption}
                  </div>
                )}
              </motion.button>
            </Reveal>
          ))}
        </div>
        <Lightbox
          open={open}
          close={() => setOpen(false)}
          index={idx}
          slides={slides as never}
          controller={{ closeOnBackdropClick: true }}
          styles={{ container: { backgroundColor: "rgba(0,0,0,.92)" } }}
        />

      </div>
    </section>
  );
}

/* ---------------- TESTIMONIALS ---------------- */
function TestimonialsSection() {
  const { t, lang } = useLang();
  const { data = [] } = usePublicTestimonials();

  if (!data.length) return null;
  return (
    <section id="testimonials" className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <SectionHeader title={t("testimonials")} />
        <div className="grid gap-5 md:grid-cols-3">
          {data.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -4 }}
                className="h-full rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:shadow-xl"
              >
                <div className="mb-3 flex">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className={`h-4 w-4 ${k < r.rating ? "fill-primary text-primary" : "text-muted"}`} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">
                  “{lang === "ar" ? r.text_ar : r.text_he}”
                </p>
                <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full font-bold text-primary-foreground"
                       style={{ background: "var(--gradient-primary)" }}>
                    {r.name.charAt(0)}
                  </div>
                  <div className="font-semibold">{r.name}</div>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */
function FaqSection() {
  const { t, lang } = useLang();
  const [openId, setOpenId] = useState<string | null>(null);
  const { data = [] } = usePublicFaqs();

  if (!data.length) return null;
  return (
    <section id="faq" className="px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <SectionHeader title={t("faq")} />
        <div className="space-y-3">
          {data.map((f, i) => {
            const open = openId === f.id;
            return (
              <Reveal key={f.id} delay={i * 0.05}>
                <div className={`overflow-hidden rounded-2xl border bg-card shadow-sm transition ${open ? "border-primary" : "border-border"}`}>
                  <button
                    onClick={() => setOpenId(open ? null : f.id)}
                    className="flex w-full items-center justify-between gap-3 p-4 text-start font-semibold"
                  >
                    <span>{lang === "ar" ? f.question_ar : f.question_he}</span>
                    <ChevronDown className={`h-5 w-5 shrink-0 text-primary transition ${open ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="border-t border-border px-4 pb-4 pt-3 text-sm text-muted-foreground leading-relaxed">
                          {lang === "ar" ? f.answer_ar : f.answer_he}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- BOOKING (kept behavior) ---------------- */
function BookingForm({ services, preselectedId, onConsumePreselect }: { services: Service[]; preselectedId: string; onConsumePreselect: () => void }) {
  const { t, lang } = useLang();
  const { data: settings } = useSiteSettings();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "", phone: "", serviceId: "", date: "", time: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const selectedService = useMemo(() => services.find((s) => s.id === form.serviceId), [services, form.serviceId]);

  // handle preselection (side effect, not a memo)
  useEffect(() => {
    if (preselectedId && preselectedId !== form.serviceId) {
      setForm((f) => ({ ...f, serviceId: preselectedId, time: "" }));
      onConsumePreselect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedId]);


  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const service = services.find((s) => s.id === form.serviceId);

    const appointmentAt = combineDateTime(form.date, form.time);
    const check = firstError(
      requireFields([form.name, form.phone, form.serviceId, form.date, form.time], t("required")),
      service ? { ok: true as const } : { ok: false as const, message: t("required") },
      isFutureDate(appointmentAt, lang === "ar" ? "اختاري وقتاً في المستقبل" : "בחרי זמן עתידי"),
    );
    if (!check.ok) { reportError(check.message); return; }
    if (!service) return;

    setSubmitting(true);
    try {
      await bookingService.createAppointment({
        client_name: form.name.trim(),
        client_phone: form.phone.trim(),
        service_id: service.id,
        service_name: pickLang(service.name_ar, service.name_he, lang),
        service_price: service.price,
        appointment_at: appointmentAt.toISOString(),
        notes: form.notes.trim() || null,
      });
    } catch (err) {
      setSubmitting(false);
      reportError(err, t("error"));
      return;
    }
    setSubmitting(false);

    const msg = whatsappTemplates.newBooking({
      lang,
      clientName: form.name,
      clientPhone: form.phone,
      serviceNameAr: service.name_ar,
      serviceNameHe: service.name_he,
      price: service.price,
      currency: settings?.currency || "",
      date: form.date,
      time: form.time,
      notes: form.notes,
    });
    whatsappService.open(whatsappService.businessLink(settings?.whatsapp || "", msg));
    reportSuccess(t("bookingSent"));
    setSuccess(true);
    qc.invalidateQueries({ queryKey: QK.slots() });
    setForm({ name: "", phone: "", serviceId: "", date: "", time: "", notes: "" });
  }

  const today = todayISODate();


  return (
    <section id="booking" className="px-4 py-16">
      <div className="mx-auto max-w-xl">
        <SectionHeader title={t("bookingTitle")} />
        <Reveal>
          <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-xl md:p-8">
            <Field label={t("name")}>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
            <Field label={t("phone")}>
              <input type="tel" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="050-000-0000" />
            </Field>
            <Field label={t("service")}>
              <select className="input" value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value, time: "" })} required>
                <option value="">{t("selectService")}</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{(lang === "ar" ? s.name_ar : s.name_he)} — {s.price}₪</option>
                ))}
              </select>
            </Field>
            <Field label={t("date")}>
              <input type="date" min={today} className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value, time: "" })} required />
            </Field>
            <Field label={t("time")}>
              <SlotPicker date={form.date} duration={selectedService?.duration_minutes || 0} value={form.time} onChange={(v) => setForm({ ...form, time: v })} />
            </Field>
            <Field label={t("notes")}>
              <textarea className="input min-h-[80px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>

            <motion.button
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              type="submit" disabled={submitting}
              className="w-full rounded-xl py-3.5 font-bold text-primary-foreground shadow-lg disabled:opacity-60"
              style={{ background: "var(--gradient-primary)" }}
            >
              {submitting ? "..." : t("submit")}
            </motion.button>

            {success && (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 p-3 text-sm text-primary">
                <CheckCircle2 className="h-4 w-4" />
                {t("bookingSent")}
              </div>
            )}
          </form>
        </Reveal>

        <style>{`
          .input {
            width: 100%;
            border: 1px solid var(--color-border);
            background: var(--color-background);
            border-radius: 0.85rem;
            padding: 0.75rem 0.95rem;
            font-family: inherit;
            font-size: 0.95rem;
            outline: none;
            transition: border-color .15s, box-shadow .15s;
          }
          .input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px oklch(0.7 0.16 355 / 0.15); }
        `}</style>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function SlotPicker({ date, duration, value, onChange }: { date: string; duration: number; value: string; onChange: (v: string) => void }) {
  const { t } = useLang();
  const enabled = !!date && !!duration;
  const { data, isLoading } = useAvailableSlots(date, duration);


  if (!enabled) return <div className="rounded-xl border border-dashed border-border p-3 text-center text-sm text-muted-foreground">{t("pickDateService")}</div>;
  if (isLoading) return <div className="rounded-xl border border-dashed border-border p-3 text-center text-sm text-muted-foreground">{t("loadingSlots")}</div>;
  if (data?.closed) return <div className="rounded-xl border border-dashed border-border p-3 text-center text-sm text-muted-foreground">{t("closedDay")}</div>;
  if (!data?.slots.length) return <div className="rounded-xl border border-dashed border-border p-3 text-center text-sm text-muted-foreground">{t("noSlots")}</div>;

  return (
    <div className="rounded-xl border border-border bg-background p-2">
      <div className="mb-2 text-center text-xs font-medium text-muted-foreground">{t("availableTimes")}</div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {data.slots.map((s) => {
          const selected = value === s.value;
          return (
            <button key={s.value} type="button" onClick={() => onChange(s.value)} aria-pressed={selected}
              className={`rounded-lg px-2 py-2 text-sm font-semibold transition ${
                selected ? "text-primary-foreground shadow-md scale-[1.03]" : "border border-border bg-card hover:border-primary hover:text-primary"
              }`}
              style={selected ? { background: "var(--gradient-primary)" } : undefined}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- CONTACT ---------------- */
function ContactSection() {
  const { t, lang } = useLang();
  const { data: settings } = useSiteSettings();
  if (!settings) return null;
  const address = lang === "ar" ? settings.address_ar : settings.address_he;
  const hoursText = lang === "ar" ? settings.hours_text_ar : settings.hours_text_he;
  const phoneDigits = settings.phone.replace(/\D/g, "");
  const wa = settings.whatsapp;
  const items = [
    { icon: Phone, label: t("callNow"), value: settings.phone, href: `tel:${phoneDigits}` },
    { icon: MessageCircle, label: t("whatsapp"), value: settings.phone, href: `https://wa.me/${wa}` },
    ...(settings.instagram ? [{ icon: Instagram, label: t("instagram"), value: settings.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, "@"), href: settings.instagram.startsWith("http") ? settings.instagram : `https://instagram.com/${settings.instagram.replace(/^@/, "")}` }] : []),
    { icon: MapPin, label: t("address"), value: address, href: settings.maps_url || `https://maps.google.com/?q=${encodeURIComponent(address)}` },
    { icon: Clock, label: t("workingHours"), value: hoursText },
  ];
  return (
    <section id="contact" className="px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <SectionHeader title={t("contact")} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => {
            const Cmp = it.icon;
            const inner = (
              <motion.div whileHover={{ y: -4 }} className="h-full rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:border-primary hover:shadow-lg">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: "var(--gradient-primary)" }}>
                  <Cmp className="h-5 w-5 text-white" />
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{it.label}</div>
                <div className="mt-1 font-bold">{it.value}</div>
              </motion.div>
            );
            return (
              <Reveal key={i} delay={i * 0.05}>
                {it.href ? <a href={it.href} target={it.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="block h-full">{inner}</a> : inner}
              </Reveal>
            );
          })}
        </div>
        {settings.maps_url && (
          <Reveal>
            <div className="mt-6 text-center">
              <a href={settings.maps_url} target="_blank" rel="noreferrer"
                 className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold text-primary-foreground shadow-lg transition hover:scale-105"
                 style={{ background: "var(--gradient-primary)" }}>
                <Navigation className="h-4 w-4" />
                {t("navigate")}
              </a>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

/* ---------------- FOOTER ---------------- */
function SiteFooter() {
  const { t, lang } = useLang();
  const { data: settings } = useSiteSettings();
  const bizName = settings ? (lang === "ar" ? settings.business_name_ar : settings.business_name_he) : t("brand");
  const footerText = settings ? (lang === "ar" ? settings.footer_text_ar : settings.footer_text_he) : "";
  const address = settings ? (lang === "ar" ? settings.address_ar : settings.address_he) : t("location");
  const phone = settings?.phone;
  const links = [
    { href: "#services", label: t("services") },
    { href: "#gallery", label: t("gallery") },
    { href: "#testimonials", label: t("testimonials") },
    { href: "#faq", label: t("faq") },
    { href: "#booking", label: t("bookNow") },
  ];
  return (
    <footer className="mt-8 border-t border-border/60 bg-card/40 backdrop-blur">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--gradient-primary)" }}>
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="text-lg font-black">{bizName}</div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{footerText}</p>
        </div>
        <div>
          <div className="mb-3 text-sm font-bold">{t("quickLinks")}</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {links.map((l) => (
              <li key={l.href}><a href={l.href} className="transition hover:text-primary">{l.label}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-3 text-sm font-bold">{t("contact")}</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-primary" />{address}</li>
            {phone && <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-primary" /><a href={`tel:${phone.replace(/\D/g,"")}`}>{phone}</a></li>}
            {settings?.instagram && (
              <li className="flex items-center gap-2"><Instagram className="h-3.5 w-3.5 text-primary" />
                <a href={settings.instagram.startsWith("http") ? settings.instagram : `https://instagram.com/${settings.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer">Instagram</a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 px-4 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {bizName} · {t("allRightsReserved")}
      </div>
    </footer>
  );
}
