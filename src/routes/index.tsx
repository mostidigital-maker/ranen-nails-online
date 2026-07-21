import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { useSiteSettings } from "@/lib/site";
import { SiteHeader } from "@/components/SiteHeader";
import { Reveal, CountUp, SectionHeader } from "@/components/SectionReveal";
import {
  MapPin, Clock, Phone, Sparkles, Calendar, CheckCircle2, ChevronDown,
  Heart, ShieldCheck, Star, MessageCircle, Instagram, Navigation, ImageIcon, Award, Users,
} from "lucide-react";
import { toast } from "sonner";
import { getAvailableSlots } from "@/lib/availability";
import { motion, AnimatePresence } from "framer-motion";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "رنين نيلز | Ranen Nails - دير الاسد" },
      { name: "description", content: "صالون رنين نيلز للعناية بالأظافر والحواجب. بناء أظافر، لاك جل، أكريل، تصميم حواجب. احجزي موعدك أونلاين." },
    ],
  }),
  component: Index,
});

type Service = {
  id: string;
  name_ar: string;
  name_he: string;
  description_ar: string | null;
  description_he: string | null;
  price: number;
  duration_minutes: number;
};

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

  const { data: services = [] } = useQuery({
    queryKey: ["services-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id,name_ar,name_he,description_ar,description_he,price,duration_minutes")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data as Service[];
    },
  });

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
        <BookingForm services={services} preselectedId={preselectedService} onConsumePreselect={() => setPreselectedService("")} />
        <ContactSection />
      </main>
      <SiteFooter />
    </div>
  );
}


/* ---------------- HERO ---------------- */
function HeroSection({ bizName, tagline, address }: { bizName: string; tagline: string; address: string }) {
  const { t, lang } = useLang();
  const { data: settings } = useSiteSettings();
  const title = settings ? (lang === "ar" ? settings.hero_title_ar : settings.hero_title_he) : bizName;
  const subtitle = settings ? (lang === "ar" ? settings.hero_subtitle_ar : settings.hero_subtitle_he) : tagline;
  const heroImage = settings?.hero_image_url;

  return (
    <section className="relative overflow-hidden px-4 pt-12 pb-20 md:pt-20 md:pb-28">
      <div className="absolute inset-0 -z-10 opacity-40" style={{ background: "var(--gradient-primary)", filter: "blur(120px)" }} />
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center md:text-start"
        >
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg md:h-20 md:w-20"
               style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
            <Sparkles className="h-8 w-8 text-white md:h-10 md:w-10" />
          </div>
          <div className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">{bizName}</div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            {title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl md:mx-0 mx-auto">{subtitle}</p>

          <div className="mt-6 flex items-center justify-center md:justify-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{address}</span>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center md:justify-start gap-3">
            <motion.a
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}
              href="#booking"
              className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-bold text-primary-foreground shadow-lg"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-soft)" }}
            >
              <Calendar className="h-5 w-5" />
              {t("bookNow")}
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}
              href="#gallery"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-6 py-3.5 font-bold backdrop-blur transition hover:border-primary hover:text-primary"
            >
              <ImageIcon className="h-5 w-5" />
              {t("viewGallery")}
            </motion.a>
          </div>
        </motion.div>

        {/* Image slot */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] border border-border shadow-2xl">
            {heroImage ? (
              <img src={heroImage} alt={bizName} fetchPriority="high" decoding="async" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center"
                   style={{ background: "var(--gradient-primary)" }}>
                <Sparkles className="h-20 w-20 text-white/70" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
          {/* floating badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="absolute -bottom-4 -start-4 rounded-2xl border border-border bg-card px-4 py-3 shadow-xl backdrop-blur"
          >
            <div className="flex items-center gap-2">
              <div className="flex">
                {[0,1,2,3,4].map(i => <Star key={i} className="h-4 w-4 fill-primary text-primary" />)}
              </div>
              <div className="text-sm font-bold">5.0</div>
            </div>
            <div className="text-xs text-muted-foreground">{lang === "ar" ? "تقييم العميلات" : "דירוג לקוחות"}</div>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
        className="mt-16 flex justify-center text-muted-foreground"
      >
        <ChevronDown className="h-6 w-6 animate-bounce" />
      </motion.div>
    </section>
  );
}

/* ---------------- STATS ---------------- */
type Stat = { id: string; label_ar: string; label_he: string; value: number; suffix: string | null };
function StatsSection() {
  const { lang } = useLang();
  const { data = [] } = useQuery({
    queryKey: ["stats-public"],
    queryFn: async () => {
      const { data, error } = await supabase.from("stats" as never).select("*").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return data as unknown as Stat[];
    },
  });
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
type AboutCard = { id: string; icon: string; title_ar: string; title_he: string; text_ar: string; text_he: string };
function AboutSection() {
  const { t, lang } = useLang();
  const { data: settings } = useSiteSettings();
  const { data = [] } = useQuery({
    queryKey: ["about-cards-public"],
    queryFn: async () => {
      const { data, error } = await supabase.from("about_cards" as never).select("*").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return data as unknown as AboutCard[];
    },
  });
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
  if (!services.length) return null;
  return (
    <section id="services" className="px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <SectionHeader title={t("services")} subtitle={t("servicesSubtitle")} />
        <div className="grid gap-5 md:grid-cols-2">
          {services.map((s, i) => (
            <Reveal key={s.id} delay={i * 0.06}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="group flex h-full flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:border-primary hover:shadow-xl"
              >
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
                      <div className="text-xs text-muted-foreground">{t("currency")}</div>
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
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- GALLERY ---------------- */
type GalleryItem = { id: string; media_type: "image" | "video"; storage_path: string | null; media_url: string; caption: string | null };
function GallerySection() {
  const { t } = useLang();

  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  const { data = [] } = useQuery({
    queryKey: ["gallery-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_items")
        .select("id,media_type,storage_path,media_url,caption")
        .eq("is_active", true)
        .order("sort_order")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const items = (data || []) as GalleryItem[];
      await Promise.all(items.map(async (it) => {
        if (it.storage_path) {
          const { data: signed } = await supabase.storage.from("gallery").createSignedUrl(it.storage_path, 60 * 60 * 24 * 7);
          if (signed?.signedUrl) it.media_url = signed.signedUrl;
        }
      }));
      return items;
    },
  });

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
type Testimonial = { id: string; name: string; text_ar: string; text_he: string; rating: number };
function TestimonialsSection() {
  const { t, lang } = useLang();
  const { data = [] } = useQuery({
    queryKey: ["testimonials-public"],
    queryFn: async () => {
      const { data, error } = await supabase.from("testimonials" as never).select("*").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return data as unknown as Testimonial[];
    },
  });
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
type Faq = { id: string; question_ar: string; question_he: string; answer_ar: string; answer_he: string };
function FaqSection() {
  const { t, lang } = useLang();
  const [openId, setOpenId] = useState<string | null>(null);
  const { data = [] } = useQuery({
    queryKey: ["faqs-public"],
    queryFn: async () => {
      const { data, error } = await supabase.from("faqs" as never).select("*").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return data as unknown as Faq[];
    },
  });
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
    if (!form.name || !form.phone || !form.serviceId || !form.date || !form.time) {
      toast.error(t("required")); return;
    }
    const service = services.find((s) => s.id === form.serviceId);
    if (!service) return;

    const appointmentAt = new Date(`${form.date}T${form.time}:00`);
    if (appointmentAt.getTime() <= Date.now()) {
      toast.error(lang === "ar" ? "اختاري وقتاً في المستقبل" : "בחרי זמן עתידי");
      return;
    }

    setSubmitting(true);
    const serviceName = lang === "ar" ? service.name_ar : service.name_he;
    const { error } = await supabase.from("appointments").insert({
      client_name: form.name.trim(),
      client_phone: form.phone.trim(),
      service_id: service.id,
      service_name: serviceName,
      service_price: service.price,
      appointment_at: appointmentAt.toISOString(),
      notes: form.notes.trim() || null,
    });
    setSubmitting(false);
    if (error) { toast.error(t("error") + ": " + error.message); return; }

    const msg = lang === "ar"
      ? `حجز جديد 💅\nالاسم: ${form.name}\nالهاتف: ${form.phone}\nالخدمة: ${service.name_ar}\nالسعر: ${service.price}₪\nالتاريخ: ${form.date}\nالوقت: ${form.time}${form.notes ? `\nملاحظات: ${form.notes}` : ""}`
      : `תור חדש 💅\nשם: ${form.name}\nטלפון: ${form.phone}\nשירות: ${service.name_he}\nמחיר: ${service.price}₪\nתאריך: ${form.date}\nשעה: ${form.time}${form.notes ? `\nהערות: ${form.notes}` : ""}`;
    const wa = settings?.whatsapp || "972502204606";
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, "_blank");
    toast.success(t("bookingSent"));
    setSuccess(true);
    qc.invalidateQueries({ queryKey: ["slots"] });
    setForm({ name: "", phone: "", serviceId: "", date: "", time: "", notes: "" });
  }

  const today = new Date().toISOString().split("T")[0];

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
  const { data, isLoading } = useQuery({
    queryKey: ["slots", date, duration],
    queryFn: () => getAvailableSlots(date, duration),
    enabled, staleTime: 30_000,
  });

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
