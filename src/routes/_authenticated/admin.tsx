import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { SiteHeader } from "@/components/SiteHeader";
import { QK } from "@/core/config/queryKeys";
import { auth } from "@/core/supabase/db";
import { reportError, reportSuccess } from "@/core/errors/appError";
import { usePermissions } from "@/core/permissions/usePermissions";
import { PAYMENT_PROVIDERS } from "@/features/payments/payments.config";
import { useSiteSettings, useSiteSettingsAdmin } from "@/features/settings/hooks";
import { siteSettingsService } from "@/features/settings/siteSettings.service";
import type { SiteSettings } from "@/features/settings/types";
import { useAdminCategories, useAdminServices } from "@/features/services/hooks";
import { servicesService } from "@/features/services/services.service";
import { categoriesService } from "@/features/services/categories.service";
import type { Service as ServiceRow, ServiceCategory } from "@/features/services/types";
import { useAppointments, useBlockedSlots, useBusinessHours } from "@/features/booking/hooks";
import { bookingService } from "@/features/booking/booking.service";
import type { Appointment as AppointmentRow, BlockedSlot, BusinessHours } from "@/features/booking/types";
import { useAdminGallery } from "@/features/gallery/hooks";
import { galleryService } from "@/features/gallery/gallery.service";
import type { GalleryItem } from "@/features/gallery/types";
import { statsService, type Stat } from "@/features/stats/stats.service";
import { aboutService, type AboutCard } from "@/features/about/about.service";
import { testimonialsService, type Testimonial } from "@/features/testimonials/testimonials.service";
import { faqService, type Faq } from "@/features/faq/faq.service";
import { whatsappService, whatsappTemplates } from "@/features/notifications/whatsapp.service";
import { pickLang } from "@/shared/utils/localized";
import { clampRating, firstError, isEndAfterStart, requireFields } from "@/shared/validation/validators";
import { combineDateTime } from "@/shared/utils/datetime";
import { moveInList } from "@/shared/utils/ordering";
import { Check, Input, TextArea } from "@/shared/ui/FormFields";
import { Modal, ModalActions } from "@/shared/ui/Modal";
import { ReorderButtons } from "@/shared/ui/ReorderButtons";
import {
  CheckCircle2, XCircle, Trash2, Plus, MessageCircle, Calendar, Settings, LogOut,
  Pencil, Clock, Ban, Image as ImageIcon, Upload, Star, HelpCircle, LayoutGrid,
  BarChart3, FileText, ArrowUp, ArrowDown,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "لوحة التحكم" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type TabKey =
  | "appointments" | "services" | "gallery" | "hours" | "blocks"
  | "settings" | "categories" | "stats" | "about" | "testimonials" | "faq";

type Appointment = AppointmentRow;
type Service = ServiceRow;
type CategoryRow = ServiceCategory;

const TABS: { key: TabKey; labelAr: string; labelHe: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "appointments", labelAr: "المواعيد", labelHe: "תורים", icon: Calendar },
  { key: "settings", labelAr: "إعدادات الموقع", labelHe: "הגדרות האתר", icon: FileText },
  { key: "services", labelAr: "الخدمات", labelHe: "שירותים", icon: Settings },
  { key: "categories", labelAr: "فئات الخدمات", labelHe: "קטגוריות", icon: LayoutGrid },
  { key: "gallery", labelAr: "المعرض", labelHe: "גלריה", icon: ImageIcon },
  { key: "stats", labelAr: "إحصائيات", labelHe: "סטטיסטיקות", icon: BarChart3 },
  { key: "about", labelAr: "بطاقات عن الصالون", labelHe: "כרטיסי אודות", icon: LayoutGrid },
  { key: "testimonials", labelAr: "التقييمات", labelHe: "המלצות", icon: Star },
  { key: "faq", labelAr: "أسئلة شائعة", labelHe: "שאלות נפוצות", icon: HelpCircle },
  { key: "hours", labelAr: "ساعات العمل", labelHe: "שעות פעילות", icon: Clock },
  { key: "blocks", labelAr: "أوقات محجوبة", labelHe: "זמנים חסומים", icon: Ban },
];

function AdminPage() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("appointments");
  const qc = useQueryClient();
  const { isAdmin, isLoading: rolesLoading } = usePermissions();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (!rolesLoading && !isAdmin) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-destructive">{lang === "ar" ? "غير مصرح" : "אין הרשאה"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{lang === "ar" ? "هذا الحساب ليس مديراً." : "החשבון אינו אדמין."}</p>
          <button onClick={signOut} className="mt-4 rounded-lg bg-primary px-4 py-2 text-primary-foreground">{t("logout")}</button>
        </main>
      </div>

    );
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{t("dashboard")}</h1>
          <div className="flex items-center gap-2">
            <Link to="/" className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:border-primary">{lang === "ar" ? "الموقع" : "האתר"}</Link>
            <button onClick={signOut} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:border-destructive hover:text-destructive">
              <LogOut className="h-3.5 w-3.5" />{t("logout")}
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-2">
          {TABS.map((k) => {
            const Ic = k.icon;
            const active = tab === k.key;
            return (
              <button
                key={k.key}
                onClick={() => setTab(k.key)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${active ? "text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
                style={active ? { background: "var(--gradient-primary)" } : undefined}
              >
                <Ic className="h-4 w-4" />
                {lang === "ar" ? k.labelAr : k.labelHe}
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          {tab === "appointments" && <AppointmentsPanel />}
          {tab === "settings" && <SettingsPanel />}
          {tab === "services" && <ServicesPanel />}
          {tab === "categories" && <CategoriesPanel />}
          {tab === "gallery" && <GalleryPanel />}
          {tab === "stats" && <StatsPanel />}
          {tab === "about" && <AboutPanel />}
          {tab === "testimonials" && <TestimonialsPanel />}
          {tab === "faq" && <FaqPanel />}
          {tab === "hours" && <HoursPanel />}
          {tab === "blocks" && <BlocksPanel />}
        </div>
      </main>
    </div>

  );
}

/* ---------------- APPOINTMENTS ---------------- */
function AppointmentsPanel() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const { data: settings } = useSiteSettings();

  const { data = [], isLoading } = useAppointments();

  useEffect(() => bookingService.subscribeAppointments(() => {
    qc.invalidateQueries({ queryKey: QK.appointments });
    qc.invalidateQueries({ queryKey: QK.slots() });
  }), [qc]);

  async function updateStatus(a: Appointment, status: "confirmed" | "cancelled") {
    try {
      await bookingService.updateStatus(a.id, status);
    } catch (err) {
      reportError(err, t("error"));
      return;
    }
    qc.invalidateQueries({ queryKey: QK.appointments });
    qc.invalidateQueries({ queryKey: QK.slots() });
    const input = {
      lang,
      businessName: settings ? pickLang(settings.business_name_ar, settings.business_name_he, lang) : "",
      clientName: a.client_name,
      serviceName: a.service_name,
      appointmentAt: a.appointment_at,
    };
    const msg = status === "confirmed" ? whatsappTemplates.confirmed(input) : whatsappTemplates.cancelled(input);
    whatsappService.open(whatsappService.clientLink(a.client_phone, msg));
    reportSuccess(t("success"));
  }

  async function remove(id: string) {
    if (!confirm(lang === "ar" ? "حذف الموعد؟" : "למחוק את התור?")) return;
    try {
      await bookingService.removeAppointment(id);
    } catch (err) {
      reportError(err, t("error"));
      return;
    }
    qc.invalidateQueries({ queryKey: QK.appointments });
    qc.invalidateQueries({ queryKey: QK.slots() });
  }

  if (isLoading) return <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground" role="status" aria-live="polite">{t("loadingSlots")}</div>;
  if (!data.length) return <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">{t("noAppointments")}</div>;

  const statusStyle = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    confirmed: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
  } as const;

  return (
    <div className="space-y-3">
      {data.map((a) => {
        const dt = new Date(a.appointment_at);

        return (
          <div key={a.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold truncate">{a.client_name}</h3>
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${statusStyle[a.status]}`}>{t(a.status)}</span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">📞 {a.client_phone} · 💅 {a.service_name} · {a.service_price}₪</div>
                <div className="mt-1 text-sm font-medium">
                  📅 {dt.toLocaleDateString(lang === "ar" ? "ar" : "he")} — {dt.toLocaleTimeString(lang === "ar" ? "ar" : "he", { hour: "2-digit", minute: "2-digit" })}
                </div>
                {a.notes && <div className="mt-1 text-sm text-muted-foreground">📝 {a.notes}</div>}
              </div>
              <div className="flex flex-wrap gap-2">
                {a.status !== "confirmed" && (
                  <button onClick={() => updateStatus(a, "confirmed")} className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700">
                    <CheckCircle2 className="h-4 w-4" />{t("confirm")}
                  </button>
                )}
                {a.status !== "cancelled" && (
                  <button onClick={() => updateStatus(a, "cancelled")} className="flex items-center gap-1 rounded-lg bg-orange-600 px-3 py-1.5 text-sm text-white hover:bg-orange-700">
                    <XCircle className="h-4 w-4" />{t("cancel")}
                  </button>
                )}
                <a href={whatsappService.clientLink(a.client_phone)} target="_blank" rel="noreferrer"
                   className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:border-primary">
                  <MessageCircle className="h-4 w-4" />WhatsApp
                </a>
                <button onClick={() => remove(a.id)} className="rounded-lg border border-border p-1.5 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Helpers ---------------- */
/* ---------------- SETTINGS ---------------- */
function SettingsPanel() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const [form, setForm] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);

  const { data } = useSiteSettingsAdmin();
  useEffect(() => { if (data && !form) setForm(data); }, [data]); // eslint-disable-line

  async function save() {
    if (!form) return;
    setSaving(true);
    const { id: _id, ...patch } = form;
    void _id;
    try {
      await siteSettingsService.update(patch);
    } catch (err) {
      setSaving(false);
      reportError(err, t("error"));
      return;
    }
    setSaving(false);
    qc.invalidateQueries({ queryKey: QK.siteSettings });
    qc.invalidateQueries({ queryKey: QK.siteSettingsAdmin });
    reportSuccess(t("success"));
  }

  if (!form) return <div className="text-center text-muted-foreground py-8">...</div>;
  const f = form;
  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setForm({ ...f, [k]: v });

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-4 font-bold">{title}</h3>
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </div>
  );

  return (
    <div className="space-y-4">
      <Section title={lang === "ar" ? "معلومات العمل" : "פרטי העסק"}>
        <Input label={t("nameAr")} value={f.business_name_ar} onChange={(v) => set("business_name_ar", v)} />
        <Input label={t("nameHe")} value={f.business_name_he} onChange={(v) => set("business_name_he", v)} />
        <Input label={lang === "ar" ? "الشعار (بالعربية)" : "סלוגן (ערבית)"} value={f.tagline_ar} onChange={(v) => set("tagline_ar", v)} />
        <Input label={lang === "ar" ? "الشعار (بالعبرية)" : "סלוגן (עברית)"} value={f.tagline_he} onChange={(v) => set("tagline_he", v)} />
        <Input label={t("logoUrl")} value={f.logo_url || ""} onChange={(v) => set("logo_url", v || null)} />
        <Input label={t("heroImage")} value={f.hero_image_url || ""} onChange={(v) => set("hero_image_url", v || null)} />
        <Input label={lang === "ar" ? "الاسم باللاتينية (تحت الشعار)" : "שם באנגלית (מתחת ללוגו)"} value={f.brand_latin || ""} onChange={(v) => set("brand_latin", v || null)} />
        <Input label="Favicon URL" value={f.favicon_url || ""} onChange={(v) => set("favicon_url", v || null)} />
        <Input label={lang === "ar" ? "رمز العملة" : "סמל מטבע"} value={f.currency} onChange={(v) => set("currency", v)} />
      </Section>

      <Section title={lang === "ar" ? "قسم الغلاف (Hero)" : "מקטע Hero"}>
        <Input label={lang === "ar" ? "عنوان الغلاف (عربية)" : "כותרת Hero (ערבית)"} value={f.hero_title_ar} onChange={(v) => set("hero_title_ar", v)} />
        <Input label={lang === "ar" ? "عنوان الغلاف (عبرية)" : "כותרת Hero (עברית)"} value={f.hero_title_he} onChange={(v) => set("hero_title_he", v)} />
        <TextArea label={lang === "ar" ? "نص فرعي (عربية)" : "טקסט משנה (ערבית)"} value={f.hero_subtitle_ar} onChange={(v) => set("hero_subtitle_ar", v)} />
        <TextArea label={lang === "ar" ? "نص فرعي (عبرية)" : "טקסט משנה (עברית)"} value={f.hero_subtitle_he} onChange={(v) => set("hero_subtitle_he", v)} />
      </Section>

      <Section title={lang === "ar" ? "عن الصالون" : "על הסלון"}>
        <Input label={lang === "ar" ? "عنوان القسم (عربية)" : "כותרת (ערבית)"} value={f.about_title_ar} onChange={(v) => set("about_title_ar", v)} />
        <Input label={lang === "ar" ? "عنوان القسم (عبرية)" : "כותרת (עברית)"} value={f.about_title_he} onChange={(v) => set("about_title_he", v)} />
        <TextArea label={lang === "ar" ? "نص (عربية)" : "טקסט (ערבית)"} value={f.about_text_ar} onChange={(v) => set("about_text_ar", v)} />
        <TextArea label={lang === "ar" ? "نص (عبرية)" : "טקסט (עברית)"} value={f.about_text_he} onChange={(v) => set("about_text_he", v)} />
      </Section>

      <Section title={t("contact")}>
        <Input label={t("phone")} value={f.phone} onChange={(v) => set("phone", v)} />
        <Input label={t("whatsapp") + " (972...)"} value={f.whatsapp} onChange={(v) => set("whatsapp", v)} />
        <Input label={t("instagram")} value={f.instagram || ""} onChange={(v) => set("instagram", v || null)} />
        <Input label="Facebook" value={f.facebook_url || ""} onChange={(v) => set("facebook_url", v || null)} />
        <Input label="TikTok" value={f.tiktok_url || ""} onChange={(v) => set("tiktok_url", v || null)} />
        <Input label="YouTube" value={f.youtube_url || ""} onChange={(v) => set("youtube_url", v || null)} />
        <Input label={lang === "ar" ? "البريد الإلكتروني" : "אימייל"} value={f.email || ""} onChange={(v) => set("email", v || null)} />
        <Input label={lang === "ar" ? "رابط الخرائط" : "כתובת מפה"} value={f.maps_url || ""} onChange={(v) => set("maps_url", v || null)} />
        <Input label={t("address") + " (ar)"} value={f.address_ar} onChange={(v) => set("address_ar", v)} />
        <Input label={t("address") + " (he)"} value={f.address_he} onChange={(v) => set("address_he", v)} />
        <Input label={t("workingHours") + " (ar)"} value={f.hours_text_ar} onChange={(v) => set("hours_text_ar", v)} />
        <Input label={t("workingHours") + " (he)"} value={f.hours_text_he} onChange={(v) => set("hours_text_he", v)} />
      </Section>

      <Section title={lang === "ar" ? "الحجوزات" : "הזמנת תורים"}>
        <Check label={lang === "ar" ? "تفعيل الحجز أونلاين" : "אפשר הזמנת תורים"} value={f.booking_enabled} onChange={(v) => set("booking_enabled", v)} />
        <Input label={lang === "ar" ? "أقصى عدد أيام مسبقاً" : "מקסימום ימים מראש"} type="number" value={String(f.booking_max_days_ahead)} onChange={(v) => set("booking_max_days_ahead", Number(v) || 0)} />
        <Input label={lang === "ar" ? "أقل مهلة قبل الموعد (دقائق)" : "התראה מינימלית (דקות)"} type="number" value={String(f.booking_min_notice_minutes)} onChange={(v) => set("booking_min_notice_minutes", Number(v) || 0)} />
        <Input label={lang === "ar" ? "الفاصل بين المواعيد (دقائق)" : "מרווח בין תורים (דקות)"} type="number" value={String(f.booking_slot_interval_minutes)} onChange={(v) => set("booking_slot_interval_minutes", Number(v) || 0)} />
        <Input label={lang === "ar" ? "المنطقة الزمنية" : "אזור זמן"} value={f.timezone} onChange={(v) => set("timezone", v)} />
      </Section>

      <Section title={lang === "ar" ? "تحسين محركات البحث (SEO)" : "SEO"}>
        <Input label={lang === "ar" ? "عنوان الصفحة" : "כותרת הדף"} value={f.seo_title || ""} onChange={(v) => set("seo_title", v || null)} />
        <Input label={lang === "ar" ? "كلمات مفتاحية" : "מילות מפתח"} value={f.seo_keywords || ""} onChange={(v) => set("seo_keywords", v || null)} />
        <TextArea label={lang === "ar" ? "وصف الصفحة" : "תיאור הדף"} value={f.seo_description || ""} onChange={(v) => set("seo_description", v || null)} />
        <Input label={lang === "ar" ? "صورة المشاركة (OG)" : "תמונת שיתוף (OG)"} value={f.og_image_url || ""} onChange={(v) => set("og_image_url", v || null)} />
        <Input label="Google site verification" value={f.google_site_verification || ""} onChange={(v) => set("google_site_verification", v || null)} />
      </Section>

      <Section title={lang === "ar" ? "التحليلات" : "אנליטיקס"}>
        <Input label="Google Analytics (G-XXXX)" value={f.ga_measurement_id || ""} onChange={(v) => set("ga_measurement_id", v || null)} />
        <Input label="Google Tag Manager (GTM-XXXX)" value={f.gtm_id || ""} onChange={(v) => set("gtm_id", v || null)} />
        <Input label="Meta Pixel ID" value={f.meta_pixel_id || ""} onChange={(v) => set("meta_pixel_id", v || null)} />
        <Input label="TikTok Pixel ID" value={f.tiktok_pixel_id || ""} onChange={(v) => set("tiktok_pixel_id", v || null)} />
      </Section>

      <Section title={lang === "ar" ? "المدفوعات" : "תשלומים"}>
        <Check label={lang === "ar" ? "تفعيل المدفوعات" : "אפשר תשלומים"} value={f.payments_enabled} onChange={(v) => set("payments_enabled", v)} />
        <Check label={lang === "ar" ? "الدفع أونلاين عند الحجز" : "תשלום אונליין בהזמנה"} value={f.online_payments_enabled} onChange={(v) => set("online_payments_enabled", v)} />
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{lang === "ar" ? "مزود الدفع" : "ספק תשלום"}</span>
          <select value={f.payments_provider} onChange={(e) => set("payments_provider", e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
            {PAYMENT_PROVIDERS.map((pv) => <option key={pv} value={pv}>{pv}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{lang === "ar" ? "الوضع" : "מצב"}</span>
          <select value={f.payments_mode} onChange={(e) => set("payments_mode", e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
            <option value="sandbox">sandbox</option>
            <option value="live">live</option>
          </select>
        </label>
        <Input label={lang === "ar" ? "المفتاح العام" : "מפתח ציבורי"} value={f.payments_public_key || ""} onChange={(v) => set("payments_public_key", v || null)} />
        <Input label={lang === "ar" ? "رابط النجاح" : "כתובת הצלחה"} value={f.payments_success_url || ""} onChange={(v) => set("payments_success_url", v || null)} />
        <Input label={lang === "ar" ? "رابط الإلغاء" : "כתובת ביטול"} value={f.payments_cancel_url || ""} onChange={(v) => set("payments_cancel_url", v || null)} />
      </Section>

      <Section title={t("footer")}>
        <TextArea label={t("footer") + " (ar)"} value={f.footer_text_ar} onChange={(v) => set("footer_text_ar", v)} />
        <TextArea label={t("footer") + " (he)"} value={f.footer_text_he} onChange={(v) => set("footer_text_he", v)} />
      </Section>

      <button onClick={save} disabled={saving}
        className="w-full rounded-xl py-3 font-bold text-primary-foreground shadow-lg disabled:opacity-60"
        style={{ background: "var(--gradient-primary)" }}>
        {saving ? "..." : t("save")}
      </button>
    </div>
  );
}

/* ---------------- SERVICES ---------------- */
function ServicesPanel() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Service> | null>(null);
  const { data: categories = [] } = useAdminCategories();
  const { data = [] } = useAdminServices();

  function refresh() {
    qc.invalidateQueries({ queryKey: QK.servicesAdmin });
    qc.invalidateQueries({ queryKey: QK.servicesPublic });
  }

  async function save() {
    if (!editing) return;
    const payload = {
      name_ar: editing.name_ar?.trim() || "",
      name_he: editing.name_he?.trim() || "",
      description_ar: editing.description_ar?.trim() || null,
      description_he: editing.description_he?.trim() || null,
      price: Number(editing.price) || 0,
      duration_minutes: Number(editing.duration_minutes) || 60,
      is_active: editing.is_active ?? true,
      sort_order: Number(editing.sort_order) || 0,
      image_url: editing.image_url?.trim() || null,
      category_id: editing.category_id || null,
    };
    if (!payload.name_ar || !payload.name_he || !payload.price) return reportError(t("required"));
    try {
      if (editing.id) await servicesService.update(editing.id, payload);
      else await servicesService.create(payload);
    } catch (err) { reportError(err, t("error")); return; }
    refresh(); setEditing(null); reportSuccess(t("success"));
  }

  async function remove(id: string) {
    if (!confirm(lang === "ar" ? "حذف الخدمة؟" : "למחוק את השירות?")) return;
    try { await servicesService.remove(id); } catch (err) { reportError(err, t("error")); return; }
    refresh();
  }
  async function toggleActive(s: Service) {
    try { await servicesService.setActive(s.id, !s.is_active); } catch (err) { reportError(err, t("error")); return; }
    refresh();
  }
  async function move(i: number, dir: -1 | 1) {
    await servicesService.move(data, i, dir);
    refresh();
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setEditing({ name_ar: "", name_he: "", description_ar: "", description_he: "", price: 0, duration_minutes: 60, is_active: true, sort_order: data.length })}
        className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold text-primary-foreground"
        style={{ background: "var(--gradient-primary)" }}
      >
        <Plus className="h-4 w-4" />{t("add")}
      </button>

      {data.map((s, i) => (
        <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <ReorderButtons onUp={() => move(i, -1)} onDown={() => move(i, 1)} disabledUp={i === 0} disabledDown={i === data.length - 1} />
            <div className="min-w-0">
              <div className="font-bold truncate">{s.name_ar} <span className="text-muted-foreground">/ {s.name_he}</span></div>
              <div className="text-sm text-muted-foreground">{s.price}₪ · {s.duration_minutes} {t("minutes")} {!s.is_active && <span className="text-destructive">· {lang === "ar" ? "متوقف" : "מושבת"}</span>}</div>
              {(s.description_ar || s.description_he) && <div className="mt-1 truncate text-xs text-muted-foreground">{lang === "ar" ? s.description_ar : s.description_he}</div>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => toggleActive(s)} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-primary">
              {s.is_active ? (lang === "ar" ? "إيقاف" : "השבת") : (lang === "ar" ? "تفعيل" : "הפעל")}
            </button>
            <button onClick={() => setEditing(s)} className="rounded-lg border border-border p-1.5 hover:border-primary"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => remove(s.id)} className="rounded-lg border border-border p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      ))}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg space-y-3 overflow-auto rounded-3xl bg-card p-6 shadow-2xl">
            <h3 className="text-lg font-bold">{editing.id ? t("edit") : t("add")}</h3>
            <Input label={t("nameAr")} value={editing.name_ar || ""} onChange={(v) => setEditing({ ...editing, name_ar: v })} />
            <Input label={t("nameHe")} value={editing.name_he || ""} onChange={(v) => setEditing({ ...editing, name_he: v })} />
            <TextArea label={t("descriptionAr")} value={editing.description_ar || ""} onChange={(v) => setEditing({ ...editing, description_ar: v })} />
            <TextArea label={t("descriptionHe")} value={editing.description_he || ""} onChange={(v) => setEditing({ ...editing, description_he: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label={t("price") + " ₪"} type="number" value={String(editing.price ?? "")} onChange={(v) => setEditing({ ...editing, price: Number(v) })} />
              <Input label={t("duration") + " (" + t("minutes") + ")"} type="number" value={String(editing.duration_minutes ?? "")} onChange={(v) => setEditing({ ...editing, duration_minutes: Number(v) })} />
            </div>
            <Input label={lang === "ar" ? "رابط صورة الخدمة" : "קישור תמונת שירות"} value={editing.image_url || ""} onChange={(v) => setEditing({ ...editing, image_url: v })} />
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{lang === "ar" ? "الفئة" : "קטגוריה"}</span>
              <select
                value={editing.category_id || ""}
                onChange={(e) => setEditing({ ...editing, category_id: e.target.value || null })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">{lang === "ar" ? "بدون فئة" : "ללא קטגוריה"}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{lang === "ar" ? c.name_ar : c.name_he}</option>
                ))}
              </select>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="rounded-lg border border-border px-4 py-2 text-sm">{t("cancel")}</button>
              <button onClick={save} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">{t("save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- SERVICE CATEGORIES ---------------- */
function CategoriesPanel() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<CategoryRow> | null>(null);

  const { data = [] } = useAdminCategories();

  function refresh() {
    qc.invalidateQueries({ queryKey: ["categories-admin"] });
    qc.invalidateQueries({ queryKey: ["service-categories"] });
  }

  async function save() {
    if (!editing) return;
    const payload = {
      name_ar: editing.name_ar?.trim() || "",
      name_he: editing.name_he?.trim() || "",
      sort_order: Number(editing.sort_order) || 0,
      is_active: editing.is_active ?? true,
    };
    if (!payload.name_ar || !payload.name_he) return reportError(t("required"));
    try {
      if (editing.id) await categoriesService.update(editing.id, payload);
      else await categoriesService.create(payload);
    } catch (err) { reportError(err, t("error")); return; }
    refresh(); setEditing(null); reportSuccess(t("success"));
  }

  async function remove(id: string) {
    if (!confirm(lang === "ar" ? "حذف الفئة؟" : "למחוק את הקטגוריה?")) return;
    try { await categoriesService.remove(id); } catch (err) { reportError(err, t("error")); return; }
    refresh();
  }

  async function move(i: number, dir: -1 | 1) {
    const b = data[i + dir]; const a = data[i]; if (!a || !b) return;
    await categoriesService.move(data, i, dir); refresh();
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setEditing({ name_ar: "", name_he: "", sort_order: data.length, is_active: true })}
        className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold text-primary-foreground"
        style={{ background: "var(--gradient-primary)" }}
      >
        <Plus className="h-4 w-4" />{t("add")}
      </button>

      {data.map((c, i) => (
        <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <ReorderButtons onUp={() => move(i, -1)} onDown={() => move(i, 1)} disabledUp={i === 0} disabledDown={i === data.length - 1} />
            <div className="truncate font-bold">{c.name_ar} <span className="text-muted-foreground">/ {c.name_he}</span></div>
            {!c.is_active && <span className="text-xs text-destructive">{lang === "ar" ? "متوقف" : "מושבת"}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(c)} className="rounded-lg border border-border p-1.5 hover:border-primary"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => remove(c.id)} className="rounded-lg border border-border p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      ))}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-3 rounded-3xl bg-card p-6 shadow-2xl">
            <h3 className="text-lg font-bold">{editing.id ? t("edit") : t("add")}</h3>
            <Input label={t("nameAr")} value={editing.name_ar || ""} onChange={(v) => setEditing({ ...editing, name_ar: v })} />
            <Input label={t("nameHe")} value={editing.name_he || ""} onChange={(v) => setEditing({ ...editing, name_he: v })} />
            <Check label={lang === "ar" ? "مفعّلة" : "פעילה"} value={editing.is_active ?? true} onChange={(v) => setEditing({ ...editing, is_active: v })} />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="rounded-lg border border-border px-4 py-2 text-sm">{t("cancel")}</button>
              <button onClick={save} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">{t("save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- STATS ---------------- */
type StatRow = Stat;
function StatsPanel() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<StatRow> | null>(null);
  const { data = [] } = useQuery({ queryKey: QK.statsAdmin, queryFn: () => statsService.listAll() });
  const refresh = () => { qc.invalidateQueries({ queryKey: QK.statsAdmin }); qc.invalidateQueries({ queryKey: QK.statsPublic }); };
  

  async function save() {
    if (!editing) return;
    const payload = {
      label_ar: editing.label_ar?.trim() || "",
      label_he: editing.label_he?.trim() || "",
      value: Number(editing.value) || 0,
      suffix: editing.suffix ?? "+",
      sort_order: Number(editing.sort_order) || 0,
      is_active: editing.is_active ?? true,
    };
    if (!payload.label_ar || !payload.label_he) return reportError(t("required"));
    try {
      if (editing.id) await statsService.update(editing.id, payload);
      else await statsService.create(payload);
    } catch (err) { reportError(err, t("error")); return; }
    refresh(); setEditing(null); reportSuccess(t("success"));
  }
  async function remove(id: string) {
    if (!confirm(lang === "ar" ? "حذف؟" : "למחוק?")) return;
    try { await statsService.remove(id); } catch (err) { reportError(err, t("error")); return; }
    refresh();
  }
  async function move(i: number, dir: -1 | 1) {
    await statsService.move(data, i, dir); refresh();
  }
  async function toggleActive(r: StatRow) {
    await statsService.setActive(r.id, !r.is_active); refresh();
  }

  return (
    <div className="space-y-3">
      <button onClick={() => setEditing({ label_ar: "", label_he: "", value: 0, suffix: "+", sort_order: data.length, is_active: true })}
        className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        <Plus className="h-4 w-4" />{t("add")}
      </button>
      {data.map((r, i) => (
        <div key={r.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <ReorderButtons onUp={() => move(i, -1)} onDown={() => move(i, 1)} disabledUp={i === 0} disabledDown={i === data.length - 1} />
            <div className="min-w-0">
              <div className="font-bold">{r.value}{r.suffix} — {r.label_ar} / {r.label_he}</div>
              {!r.is_active && <div className="text-xs text-destructive">{lang === "ar" ? "متوقف" : "מושבת"}</div>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => toggleActive(r)} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-primary">
              {r.is_active ? (lang === "ar" ? "إيقاف" : "השבת") : (lang === "ar" ? "تفعيل" : "הפעל")}
            </button>
            <button onClick={() => setEditing(r)} className="rounded-lg border border-border p-1.5 hover:border-primary"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => remove(r.id)} className="rounded-lg border border-border p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? t("edit") : t("add")}>
          <Input label={t("label") + " (ar)"} value={editing.label_ar || ""} onChange={(v) => setEditing({ ...editing, label_ar: v })} />
          <Input label={t("label") + " (he)"} value={editing.label_he || ""} onChange={(v) => setEditing({ ...editing, label_he: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t("value")} type="number" value={String(editing.value ?? 0)} onChange={(v) => setEditing({ ...editing, value: Number(v) })} />
            <Input label={t("suffix")} value={editing.suffix || ""} onChange={(v) => setEditing({ ...editing, suffix: v })} />
          </div>
          <ModalActions onCancel={() => setEditing(null)} onSave={save} cancelLabel={t("cancel")} saveLabel={t("save")} />
        </Modal>
      )}
    </div>
  );
}

/* ---------------- ABOUT CARDS ---------------- */
type AboutRow = AboutCard;
function AboutPanel() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<AboutRow> | null>(null);
  const { data = [] } = useQuery({ queryKey: QK.aboutAdmin, queryFn: () => aboutService.listAll() });
  const refresh = () => { qc.invalidateQueries({ queryKey: QK.aboutAdmin }); qc.invalidateQueries({ queryKey: QK.aboutPublic }); };
  
  async function save() {
    if (!editing) return;
    const payload = {
      icon: editing.icon?.trim() || "Sparkles",
      title_ar: editing.title_ar?.trim() || "", title_he: editing.title_he?.trim() || "",
      text_ar: editing.text_ar?.trim() || "", text_he: editing.text_he?.trim() || "",
      sort_order: Number(editing.sort_order) || 0, is_active: editing.is_active ?? true,
    };
    if (!payload.title_ar || !payload.title_he) return reportError(t("required"));
    try {
      if (editing.id) await aboutService.update(editing.id, payload);
      else await aboutService.create(payload);
    } catch (err) { reportError(err, t("error")); return; }
    refresh(); setEditing(null); reportSuccess(t("success"));
  }
  async function remove(id: string) {
    if (!confirm(lang === "ar" ? "حذف؟" : "למחוק?")) return;
    try { await aboutService.remove(id); } catch (err) { reportError(err, t("error")); return; }
    refresh();
  }
  async function move(i: number, dir: -1 | 1) {
    await aboutService.move(data, i, dir); refresh();
  }
  async function toggleActive(r: AboutRow) {
    await aboutService.setActive(r.id, !r.is_active); refresh();
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {lang === "ar"
          ? "أسماء الأيقونات المتاحة: Sparkles, ShieldCheck, Heart, Star, Award, Users, Clock, Phone, MapPin, Calendar, Instagram"
          : "אייקונים זמינים: Sparkles, ShieldCheck, Heart, Star, Award, Users, Clock, Phone, MapPin, Calendar, Instagram"}
      </p>
      <button onClick={() => setEditing({ icon: "Sparkles", title_ar: "", title_he: "", text_ar: "", text_he: "", sort_order: data.length, is_active: true })}
        className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        <Plus className="h-4 w-4" />{t("add")}
      </button>
      {data.map((r, i) => (
        <div key={r.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <ReorderButtons onUp={() => move(i, -1)} onDown={() => move(i, 1)} disabledUp={i === 0} disabledDown={i === data.length - 1} />
            <div className="min-w-0">
              <div className="font-bold truncate">[{r.icon}] {r.title_ar} / {r.title_he}</div>
              <div className="truncate text-sm text-muted-foreground">{lang === "ar" ? r.text_ar : r.text_he}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => toggleActive(r)} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-primary">
              {r.is_active ? (lang === "ar" ? "إيقاف" : "השבת") : (lang === "ar" ? "تفعيل" : "הפעל")}
            </button>
            <button onClick={() => setEditing(r)} className="rounded-lg border border-border p-1.5 hover:border-primary"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => remove(r.id)} className="rounded-lg border border-border p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? t("edit") : t("add")}>
          <Input label={t("icon")} value={editing.icon || ""} onChange={(v) => setEditing({ ...editing, icon: v })} />
          <Input label={t("title") + " (ar)"} value={editing.title_ar || ""} onChange={(v) => setEditing({ ...editing, title_ar: v })} />
          <Input label={t("title") + " (he)"} value={editing.title_he || ""} onChange={(v) => setEditing({ ...editing, title_he: v })} />
          <TextArea label={t("description") + " (ar)"} value={editing.text_ar || ""} onChange={(v) => setEditing({ ...editing, text_ar: v })} />
          <TextArea label={t("description") + " (he)"} value={editing.text_he || ""} onChange={(v) => setEditing({ ...editing, text_he: v })} />
          <ModalActions onCancel={() => setEditing(null)} onSave={save} cancelLabel={t("cancel")} saveLabel={t("save")} />
        </Modal>
      )}
    </div>
  );
}

/* ---------------- TESTIMONIALS ---------------- */
type TestimonialRow = Testimonial;
function TestimonialsPanel() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<TestimonialRow> | null>(null);
  const { data = [] } = useQuery({ queryKey: QK.testimonialsAdmin, queryFn: () => testimonialsService.listAll() });
  const refresh = () => { qc.invalidateQueries({ queryKey: QK.testimonialsAdmin }); qc.invalidateQueries({ queryKey: QK.testimonialsPublic }); };
  
  async function save() {
    if (!editing) return;
    const payload = {
      name: editing.name?.trim() || "",
      text_ar: editing.text_ar?.trim() || "", text_he: editing.text_he?.trim() || "",
      rating: clampRating(editing.rating),
      sort_order: Number(editing.sort_order) || 0, is_active: editing.is_active ?? true,
    };
    if (!payload.name || !payload.text_ar || !payload.text_he) return reportError(t("required"));
    try {
      if (editing.id) await testimonialsService.update(editing.id, payload);
      else await testimonialsService.create(payload);
    } catch (err) { reportError(err, t("error")); return; }
    refresh(); setEditing(null); reportSuccess(t("success"));
  }
  async function remove(id: string) {
    if (!confirm(lang === "ar" ? "حذف؟" : "למחוק?")) return;
    try { await testimonialsService.remove(id); } catch (err) { reportError(err, t("error")); return; }
    refresh();
  }
  async function move(i: number, dir: -1 | 1) {
    await testimonialsService.move(data, i, dir); refresh();
  }
  async function toggleActive(r: TestimonialRow) {
    await testimonialsService.setActive(r.id, !r.is_active); refresh();
  }
  return (
    <div className="space-y-3">
      <button onClick={() => setEditing({ name: "", text_ar: "", text_he: "", rating: 5, sort_order: data.length, is_active: true })}
        className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        <Plus className="h-4 w-4" />{t("add")}
      </button>
      {data.map((r, i) => (
        <div key={r.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <ReorderButtons onUp={() => move(i, -1)} onDown={() => move(i, 1)} disabledUp={i === 0} disabledDown={i === data.length - 1} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-bold">{r.name}
                <span className="flex">{Array.from({ length: 5 }).map((_, k) => <Star key={k} className={`h-3 w-3 ${k < r.rating ? "fill-primary text-primary" : "text-muted"}`} />)}</span>
              </div>
              <div className="truncate text-sm text-muted-foreground">{lang === "ar" ? r.text_ar : r.text_he}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => toggleActive(r)} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-primary">
              {r.is_active ? (lang === "ar" ? "إيقاف" : "השבת") : (lang === "ar" ? "تفعيل" : "הפעל")}
            </button>
            <button onClick={() => setEditing(r)} className="rounded-lg border border-border p-1.5 hover:border-primary"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => remove(r.id)} className="rounded-lg border border-border p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? t("edit") : t("add")}>
          <Input label={t("customerName")} value={editing.name || ""} onChange={(v) => setEditing({ ...editing, name: v })} />
          <TextArea label={t("reviewText") + " (ar)"} value={editing.text_ar || ""} onChange={(v) => setEditing({ ...editing, text_ar: v })} />
          <TextArea label={t("reviewText") + " (he)"} value={editing.text_he || ""} onChange={(v) => setEditing({ ...editing, text_he: v })} />
          <Input label={t("rating") + " (1-5)"} type="number" value={String(editing.rating ?? 5)} onChange={(v) => setEditing({ ...editing, rating: Number(v) })} />
          <ModalActions onCancel={() => setEditing(null)} onSave={save} cancelLabel={t("cancel")} saveLabel={t("save")} />
        </Modal>
      )}
    </div>
  );
}

/* ---------------- FAQ ---------------- */
type FaqRow = Faq;
function FaqPanel() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<FaqRow> | null>(null);
  const { data = [] } = useQuery({ queryKey: QK.faqsAdmin, queryFn: () => faqService.listAll() });
  const refresh = () => { qc.invalidateQueries({ queryKey: QK.faqsAdmin }); qc.invalidateQueries({ queryKey: QK.faqsPublic }); };
  
  async function save() {
    if (!editing) return;
    const payload = {
      question_ar: editing.question_ar?.trim() || "", question_he: editing.question_he?.trim() || "",
      answer_ar: editing.answer_ar?.trim() || "", answer_he: editing.answer_he?.trim() || "",
      sort_order: Number(editing.sort_order) || 0, is_active: editing.is_active ?? true,
    };
    if (!payload.question_ar || !payload.question_he) return reportError(t("required"));
    try {
      if (editing.id) await faqService.update(editing.id, payload);
      else await faqService.create(payload);
    } catch (err) { reportError(err, t("error")); return; }
    refresh(); setEditing(null); reportSuccess(t("success"));
  }
  async function remove(id: string) {
    if (!confirm(lang === "ar" ? "حذف؟" : "למחוק?")) return;
    try { await faqService.remove(id); } catch (err) { reportError(err, t("error")); return; }
    refresh();
  }
  async function move(i: number, dir: -1 | 1) {
    await faqService.move(data, i, dir); refresh();
  }
  async function toggleActive(r: FaqRow) {
    await faqService.setActive(r.id, !r.is_active); refresh();
  }
  return (
    <div className="space-y-3">
      <button onClick={() => setEditing({ question_ar: "", question_he: "", answer_ar: "", answer_he: "", sort_order: data.length, is_active: true })}
        className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        <Plus className="h-4 w-4" />{t("add")}
      </button>
      {data.map((r, i) => (
        <div key={r.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <ReorderButtons onUp={() => move(i, -1)} onDown={() => move(i, 1)} disabledUp={i === 0} disabledDown={i === data.length - 1} />
            <div className="min-w-0">
              <div className="font-bold truncate">{lang === "ar" ? r.question_ar : r.question_he}</div>
              <div className="truncate text-sm text-muted-foreground">{lang === "ar" ? r.answer_ar : r.answer_he}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => toggleActive(r)} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-primary">
              {r.is_active ? (lang === "ar" ? "إيقاف" : "השבת") : (lang === "ar" ? "تفعيل" : "הפעל")}
            </button>
            <button onClick={() => setEditing(r)} className="rounded-lg border border-border p-1.5 hover:border-primary"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => remove(r.id)} className="rounded-lg border border-border p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? t("edit") : t("add")}>
          <Input label={t("question") + " (ar)"} value={editing.question_ar || ""} onChange={(v) => setEditing({ ...editing, question_ar: v })} />
          <Input label={t("question") + " (he)"} value={editing.question_he || ""} onChange={(v) => setEditing({ ...editing, question_he: v })} />
          <TextArea label={t("answer") + " (ar)"} value={editing.answer_ar || ""} onChange={(v) => setEditing({ ...editing, answer_ar: v })} />
          <TextArea label={t("answer") + " (he)"} value={editing.answer_he || ""} onChange={(v) => setEditing({ ...editing, answer_he: v })} />
          <ModalActions onCancel={() => setEditing(null)} onSave={save} cancelLabel={t("cancel")} saveLabel={t("save")} />
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Modal helper ---------------- */
/* ---------------- HOURS ---------------- */
type Hours = BusinessHours;
function HoursPanel() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const { data = [] } = useBusinessHours();
  async function update(h: Hours, patch: Partial<Hours>) {
    try { await bookingService.updateHours(h.id, patch); } catch (err) { reportError(err, t("error")); return; }
    qc.invalidateQueries({ queryKey: QK.businessHours });
    qc.invalidateQueries({ queryKey: QK.slots() });
  }
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{lang === "ar" ? "حدّدي ساعات عمل كل يوم." : "קבעי שעות פעילות יומיות."}</p>
      {data.map((h) => (
        <div key={h.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="w-20 font-bold">{t(`day${h.day_of_week}` as never)}</div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!h.is_closed} onChange={(e) => update(h, { is_closed: !e.target.checked })} />
            <span>{h.is_closed ? t("closed") : t("open")}</span>
          </label>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t("from")}</span>
            <input type="time" disabled={h.is_closed} value={h.open_time.slice(0,5)} onChange={(e) => update(h, { open_time: e.target.value })}
              className="rounded-lg border border-border bg-background px-2 py-1 disabled:opacity-40" />
            <span className="text-muted-foreground">{t("to")}</span>
            <input type="time" disabled={h.is_closed} value={h.close_time.slice(0,5)} onChange={(e) => update(h, { close_time: e.target.value })}
              className="rounded-lg border border-border bg-background px-2 py-1 disabled:opacity-40" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t("step")}</span>
            <input type="number" min={5} step={5} disabled={h.is_closed} value={h.slot_step_minutes}
              onChange={(e) => update(h, { slot_step_minutes: Number(e.target.value) || 30 })}
              className="w-20 rounded-lg border border-border bg-background px-2 py-1 disabled:opacity-40" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- BLOCKS ---------------- */
type Block = BlockedSlot;
function BlocksPanel() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const [form, setForm] = useState({ date: "", start: "", end: "", reason: "" });
  const { data = [] } = useBlockedSlots();
  function refresh() {
    qc.invalidateQueries({ queryKey: QK.blockedSlots });
    qc.invalidateQueries({ queryKey: QK.slots() });
  }
  async function add() {
    const start = combineDateTime(form.date, form.start);
    const end = combineDateTime(form.date, form.end);
    const check = firstError(
      requireFields([form.date, form.start, form.end], t("required")),
      isEndAfterStart(start, end, lang === "ar" ? "نهاية بعد البداية" : "סיום אחרי התחלה"),
    );
    if (!check.ok) return reportError(check.message);
    try {
      await bookingService.addBlock(start.toISOString(), end.toISOString(), form.reason.trim() || null);
    } catch (err) { reportError(err, t("error")); return; }
    setForm({ date: "", start: "", end: "", reason: "" });
    refresh();
    reportSuccess(t("success"));
  }
  async function remove(id: string) {
    try { await bookingService.removeBlock(id); } catch (err) { reportError(err, t("error")); return; }
    refresh();
  }
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="font-bold mb-3">{t("addBlock")}</h3>
        <div className="grid gap-3 sm:grid-cols-4">
          <Input label={t("date")} type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
          <Input label={t("from")} type="time" value={form.start} onChange={(v) => setForm({ ...form, start: v })} />
          <Input label={t("to")} type="time" value={form.end} onChange={(v) => setForm({ ...form, end: v })} />
          <Input label={t("reason")} value={form.reason} onChange={(v) => setForm({ ...form, reason: v })} />
        </div>
        <button onClick={add} className="mt-3 flex items-center gap-2 rounded-xl px-4 py-2 font-bold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
          <Plus className="h-4 w-4" />{t("add")}
        </button>
      </div>
      {data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">{lang === "ar" ? "لا توجد أوقات محجوبة" : "אין זמנים חסומים"}</div>
      ) : data.map((b) => {
        const s = new Date(b.start_at), e = new Date(b.end_at);
        return (
          <div key={b.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
            <div>
              <div className="font-medium">
                {s.toLocaleDateString(lang === "ar" ? "ar" : "he")} · {s.toLocaleTimeString(lang === "ar" ? "ar" : "he", { hour: "2-digit", minute: "2-digit" })} — {e.toLocaleTimeString(lang === "ar" ? "ar" : "he", { hour: "2-digit", minute: "2-digit" })}
              </div>
              {b.reason && <div className="text-sm text-muted-foreground">{b.reason}</div>}
            </div>
            <button onClick={() => remove(b.id)} className="rounded-lg border border-border p-1.5 text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- GALLERY ---------------- */
type GalleryRow = GalleryItem;
function GalleryPanel() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const { data = [] } = useAdminGallery();
  const refresh = () => { qc.invalidateQueries({ queryKey: QK.galleryAdmin }); qc.invalidateQueries({ queryKey: QK.galleryPublic }); };

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      await galleryService.upload(file, caption, data.length, {
        badType: lang === "ar" ? "اختاري صورة أو فيديو" : "בחרי תמונה או סרטון",
        tooLarge: lang === "ar" ? "الحجم الأقصى 50MB" : "מקסימום 50MB",
      });
      setCaption(""); refresh(); reportSuccess(t("success"));
    } catch (err) {
      reportError(err, t("error"));
    } finally {
      setUploading(false);
    }
  }
  async function toggleActive(r: GalleryRow) {
    await galleryService.setActive(r.id, !r.is_active); refresh();
  }
  async function remove(r: GalleryRow) {
    if (!confirm(lang === "ar" ? "حذف العنصر؟" : "למחוק את הפריט?")) return;
    await galleryService.remove(r); refresh();
  }
  async function move(i: number, dir: -1 | 1) {
    const b = data[i + dir]; const a = data[i]; if (!a || !b) return;
    await moveInList("gallery_items", data, i, dir); refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="font-bold mb-3 flex items-center gap-2"><Upload className="h-4 w-4" />{t("uploadMedia")}</h3>
        <Input label={t("caption")} value={caption} onChange={setCaption} />
        <label className={`mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold text-primary-foreground ${uploading ? "opacity-60" : ""}`} style={{ background: "var(--gradient-primary)" }}>
          <Upload className="h-4 w-4" />
          {uploading ? t("uploading") : t("uploadMedia")}
          <input type="file" accept="image/*,video/*" className="hidden" disabled={uploading} onChange={onUpload} />
        </label>
        <p className="mt-2 text-xs text-muted-foreground">{lang === "ar" ? "الحد الأقصى 50MB لكل ملف" : "מקסימום 50MB לקובץ"}</p>
      </div>

      {data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">{t("galleryEmpty")}</div>
      ) : (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
          {data.map((r, i) => (
            <div key={r.id} className={`overflow-hidden rounded-2xl border bg-card ${r.is_active ? "border-border" : "border-destructive/40 opacity-70"}`}>
              <div className="aspect-square bg-muted">
                {r.media_type === "video" ? <video src={r.media_url} controls className="h-full w-full object-cover" /> : <img src={r.media_url} alt={r.caption || ""} className="h-full w-full object-cover" />}
              </div>
              <div className="p-2 text-xs">
                <div className="truncate">{r.caption || <span className="text-muted-foreground">{t(r.media_type)}</span>}</div>
                <div className="mt-2 flex items-center gap-1">
                  <ReorderButtons onUp={() => move(i, -1)} onDown={() => move(i, 1)} disabledUp={i === 0} disabledDown={i === data.length - 1} />
                  <button onClick={() => toggleActive(r)} className="flex-1 rounded-lg border border-border py-1 hover:border-primary">
                    {r.is_active ? (lang === "ar" ? "إخفاء" : "הסתר") : (lang === "ar" ? "إظهار" : "הצג")}
                  </button>
                  <button onClick={() => remove(r)} className="rounded-lg border border-border p-1.5 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
