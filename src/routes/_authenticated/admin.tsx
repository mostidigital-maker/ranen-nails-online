import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { useSiteSettings } from "@/lib/site";
import { SiteHeader } from "@/components/SiteHeader";
import { toast } from "sonner";
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

type Appointment = {
  id: string; client_name: string; client_phone: string; service_name: string;
  service_price: number; appointment_at: string;
  status: "pending" | "confirmed" | "cancelled"; notes: string | null;
};

type Service = {
  id: string; name_ar: string; name_he: string;
  description_ar: string | null; description_he: string | null;
  price: number; duration_minutes: number; is_active: boolean; sort_order: number;
  image_url: string | null; category_id: string | null;
};

type CategoryRow = {
  id: string; name_ar: string; name_he: string; sort_order: number; is_active: boolean;
};

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
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("user_roles").select("role")
        .eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!data);
    })();
  }, []);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isAdmin === false) {
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

  const { data = [], isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("appointments").select("*").order("appointment_at", { ascending: true });
      if (error) throw error;
      return data as Appointment[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("appointments-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        qc.invalidateQueries({ queryKey: ["appointments"] });
        qc.invalidateQueries({ queryKey: ["slots"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  async function updateStatus(a: Appointment, status: "confirmed" | "cancelled") {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", a.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["appointments"] });
    const bizName = lang === "ar" ? (settings?.business_name_ar || "") : (settings?.business_name_he || "");
    const dt = new Date(a.appointment_at);
    const dateStr = dt.toLocaleDateString(lang === "ar" ? "ar" : "he");
    const timeStr = dt.toLocaleTimeString(lang === "ar" ? "ar" : "he", { hour: "2-digit", minute: "2-digit" });
    const msg = status === "confirmed"
      ? (lang === "ar"
          ? `مرحباً ${a.client_name} 💕\nتم تأكيد موعدك في ${bizName}:\nالخدمة: ${a.service_name}\nالتاريخ: ${dateStr}\nالوقت: ${timeStr}\nبانتظارك!`
          : `שלום ${a.client_name} 💕\nהתור שלך ב${bizName} אושר:\nשירות: ${a.service_name}\nתאריך: ${dateStr}\nשעה: ${timeStr}\nמחכה לך!`)
      : (lang === "ar"
          ? `مرحباً ${a.client_name}\nنعتذر، تم إلغاء موعدك:\nالخدمة: ${a.service_name}\nالتاريخ: ${dateStr} ${timeStr}\nتواصلي معنا لتحديد موعد جديد.`
          : `שלום ${a.client_name}\nלצערנו התור שלך בוטל:\nשירות: ${a.service_name}\nתאריך: ${dateStr} ${timeStr}\nצרי קשר לקביעת תור חדש.`);
    const phone = a.client_phone.replace(/\D/g, "").replace(/^0/, "972");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
    toast.success(t("success"));
  }

  async function remove(id: string) {
    if (!confirm(lang === "ar" ? "حذف الموعد؟" : "למחוק את התור?")) return;
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["appointments"] });
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
                <a href={`https://wa.me/${a.client_phone.replace(/\D/g, "").replace(/^0/, "972")}`} target="_blank" rel="noreferrer"
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
function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary" />
    </label>
  );
}
function TextArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary" />
    </label>
  );
}

async function swapOrder(table: string, a: { id: string; sort_order: number }, b: { id: string; sort_order: number }) {
  await supabase.from(table as never).update({ sort_order: b.sort_order } as never).eq("id", a.id);
  await supabase.from(table as never).update({ sort_order: a.sort_order } as never).eq("id", b.id);
}

function ReorderButtons({ onUp, onDown, disabledUp, disabledDown }: { onUp: () => void; onDown: () => void; disabledUp?: boolean; disabledDown?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <button onClick={onUp} disabled={disabledUp} className="rounded-md border border-border p-1 disabled:opacity-30 hover:border-primary"><ArrowUp className="h-3 w-3" /></button>
      <button onClick={onDown} disabled={disabledDown} className="rounded-md border border-border p-1 disabled:opacity-30 hover:border-primary"><ArrowDown className="h-3 w-3" /></button>
    </div>
  );
}

/* ---------------- SETTINGS ---------------- */
type SiteSettingsRow = {
  id: number;
  business_name_ar: string; business_name_he: string;
  tagline_ar: string; tagline_he: string;
  logo_url: string | null;
  hero_title_ar: string; hero_title_he: string;
  hero_subtitle_ar: string; hero_subtitle_he: string;
  hero_image_url: string | null;
  about_title_ar: string; about_title_he: string;
  about_text_ar: string; about_text_he: string;
  phone: string; whatsapp: string; instagram: string | null;
  address_ar: string; address_he: string; maps_url: string | null;
  hours_text_ar: string; hours_text_he: string;
  footer_text_ar: string; footer_text_he: string;
  brand_latin: string | null; favicon_url: string | null; currency: string;
  email: string | null; facebook: string | null; tiktok: string | null; website_url: string | null;
  booking_enabled: boolean; booking_max_days_ahead: number;
  booking_min_notice_minutes: number; booking_slot_interval_minutes: number;
  booking_require_approval: boolean; booking_notice_ar: string | null; booking_notice_he: string | null;
  seo_title: string | null; seo_description: string | null; seo_keywords: string | null;
  og_image_url: string | null; google_site_verification: string | null;
  ga_measurement_id: string | null; gtm_id: string | null;
  meta_pixel_id: string | null; tiktok_pixel_id: string | null;
  payments_enabled: boolean; payment_provider: string | null;
  deposit_enabled: boolean; deposit_amount: number;
};

function SettingsPanel() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const [form, setForm] = useState<SiteSettingsRow | null>(null);
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["site-settings-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings" as never).select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data as unknown as SiteSettingsRow;
    },
  });
  useEffect(() => { if (data && !form) setForm(data); }, [data]); // eslint-disable-line

  async function save() {
    if (!form) return;
    setSaving(true);
    const { id: _id, ...patch } = form;
    void _id;
    const { error } = await supabase.from("site_settings" as never).update(patch as never).eq("id", 1);
    setSaving(false);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["site-settings"] });
    qc.invalidateQueries({ queryKey: ["site-settings-admin"] });
    toast.success(t("success"));
  }

  if (!form) return <div className="text-center text-muted-foreground py-8">...</div>;
  const f = form;
  const set = <K extends keyof SiteSettingsRow>(k: K, v: SiteSettingsRow[K]) => setForm({ ...f, [k]: v });

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
        <Input label="Facebook" value={f.facebook || ""} onChange={(v) => set("facebook", v || null)} />
        <Input label="TikTok" value={f.tiktok || ""} onChange={(v) => set("tiktok", v || null)} />
        <Input label={lang === "ar" ? "البريد الإلكتروني" : "אימייל"} value={f.email || ""} onChange={(v) => set("email", v || null)} />
        <Input label={lang === "ar" ? "رابط الموقع" : "כתובת האתר"} value={f.website_url || ""} onChange={(v) => set("website_url", v || null)} />
        <Input label={lang === "ar" ? "رابط الخرائط" : "כתובת מפה"} value={f.maps_url || ""} onChange={(v) => set("maps_url", v || null)} />
        <Input label={t("address") + " (ar)"} value={f.address_ar} onChange={(v) => set("address_ar", v)} />
        <Input label={t("address") + " (he)"} value={f.address_he} onChange={(v) => set("address_he", v)} />
        <Input label={t("workingHours") + " (ar)"} value={f.hours_text_ar} onChange={(v) => set("hours_text_ar", v)} />
        <Input label={t("workingHours") + " (he)"} value={f.hours_text_he} onChange={(v) => set("hours_text_he", v)} />
      </Section>

      <Section title={lang === "ar" ? "الحجوزات" : "הזמנת תורים"}>
        <Check label={lang === "ar" ? "تفعيل الحجز أونلاين" : "אפשר הזמנת תורים"} value={f.booking_enabled} onChange={(v) => set("booking_enabled", v)} />
        <Check label={lang === "ar" ? "المواعيد بحاجة لتأكيد" : "תורים דורשים אישור"} value={f.booking_require_approval} onChange={(v) => set("booking_require_approval", v)} />
        <Input label={lang === "ar" ? "أقصى عدد أيام مسبقاً" : "מקסימום ימים מראש"} type="number" value={String(f.booking_max_days_ahead)} onChange={(v) => set("booking_max_days_ahead", Number(v) || 0)} />
        <Input label={lang === "ar" ? "أقل مهلة قبل الموعد (دقائق)" : "התראה מינימלית (דקות)"} type="number" value={String(f.booking_min_notice_minutes)} onChange={(v) => set("booking_min_notice_minutes", Number(v) || 0)} />
        <Input label={lang === "ar" ? "الفاصل بين المواعيد (دقائق)" : "מרווח בין תורים (דקות)"} type="number" value={String(f.booking_slot_interval_minutes)} onChange={(v) => set("booking_slot_interval_minutes", Number(v) || 0)} />
        <TextArea label={lang === "ar" ? "ملاحظة للزبونة (عربية)" : "הערה ללקוחה (ערבית)"} value={f.booking_notice_ar || ""} onChange={(v) => set("booking_notice_ar", v || null)} />
        <TextArea label={lang === "ar" ? "ملاحظة للزبونة (عبرية)" : "הערה ללקוחה (עברית)"} value={f.booking_notice_he || ""} onChange={(v) => set("booking_notice_he", v || null)} />
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
        <Input label={lang === "ar" ? "مزود الدفع" : "ספק תשלום"} value={f.payment_provider || ""} onChange={(v) => set("payment_provider", v || null)} />
        <Check label={lang === "ar" ? "طلب عربون" : "דרוש מקדמה"} value={f.deposit_enabled} onChange={(v) => set("deposit_enabled", v)} />
        <Input label={lang === "ar" ? "قيمة العربون" : "סכום מקדמה"} type="number" value={String(f.deposit_amount)} onChange={(v) => set("deposit_amount", Number(v) || 0)} />
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
  const { data: categories = [] } = useQuery({
    queryKey: ["categories-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_categories" as never).select("*").order("sort_order");
      if (error) throw error;
      return (data || []) as unknown as CategoryRow[];
    },
  });

  const { data = [] } = useQuery({
    queryKey: ["services-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("sort_order");
      if (error) throw error;
      return (data || []) as unknown as Service[];
    },
  });

  function refresh() {
    qc.invalidateQueries({ queryKey: ["services-admin"] });
    qc.invalidateQueries({ queryKey: ["services-public"] });
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
    if (!payload.name_ar || !payload.name_he || !payload.price) return toast.error(t("required"));
    const { error } = editing.id
      ? await supabase.from("services").update(payload as never).eq("id", editing.id)
      : await supabase.from("services").insert(payload as never);
    if (error) return toast.error(error.message);
    refresh(); setEditing(null); toast.success(t("success"));
  }

  async function remove(id: string) {
    if (!confirm(lang === "ar" ? "حذف الخدمة؟" : "למחוק את השירות?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }
  async function toggleActive(s: Service) {
    const { error } = await supabase.from("services").update({ is_active: !s.is_active }).eq("id", s.id);
    if (error) return toast.error(error.message);
    refresh();
  }
  async function move(i: number, dir: -1 | 1) {
    const b = data[i + dir]; const a = data[i]; if (!a || !b) return;
    await swapOrder("services", a, b);
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

function Check({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm">
      <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
      {label}
    </label>
  );
}

/* ---------------- SERVICE CATEGORIES ---------------- */
function CategoriesPanel() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<CategoryRow> | null>(null);

  const { data = [] } = useQuery({
    queryKey: ["categories-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_categories" as never).select("*").order("sort_order");
      if (error) throw error;
      return (data || []) as unknown as CategoryRow[];
    },
  });

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
    if (!payload.name_ar || !payload.name_he) return toast.error(t("required"));
    const { error } = editing.id
      ? await supabase.from("service_categories" as never).update(payload as never).eq("id", editing.id)
      : await supabase.from("service_categories" as never).insert(payload as never);
    if (error) return toast.error(error.message);
    refresh(); setEditing(null); toast.success(t("success"));
  }

  async function remove(id: string) {
    if (!confirm(lang === "ar" ? "حذف الفئة؟" : "למחוק את הקטגוריה?")) return;
    const { error } = await supabase.from("service_categories" as never).delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }

  async function move(i: number, dir: -1 | 1) {
    const b = data[i + dir]; const a = data[i]; if (!a || !b) return;
    await swapOrder("service_categories", a, b); refresh();
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
type StatRow = { id: string; label_ar: string; label_he: string; value: number; suffix: string | null; sort_order: number; is_active: boolean };
function StatsPanel() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<StatRow> | null>(null);
  const { data = [] } = useQuery({
    queryKey: ["stats-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("stats" as never).select("*").order("sort_order");
      if (error) throw error;
      return data as unknown as StatRow[];
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["stats-admin"] }); qc.invalidateQueries({ queryKey: ["stats-public"] }); };

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
    if (!payload.label_ar || !payload.label_he) return toast.error(t("required"));
    const { error } = editing.id
      ? await supabase.from("stats" as never).update(payload as never).eq("id", editing.id)
      : await supabase.from("stats" as never).insert(payload as never);
    if (error) return toast.error(error.message);
    refresh(); setEditing(null); toast.success(t("success"));
  }
  async function remove(id: string) {
    if (!confirm(lang === "ar" ? "حذف؟" : "למחוק?")) return;
    const { error } = await supabase.from("stats" as never).delete().eq("id", id);
    if (error) return toast.error(error.message); refresh();
  }
  async function move(i: number, dir: -1 | 1) {
    const b = data[i + dir]; const a = data[i]; if (!a || !b) return;
    await swapOrder("stats", a, b); refresh();
  }
  async function toggleActive(r: StatRow) {
    await supabase.from("stats" as never).update({ is_active: !r.is_active } as never).eq("id", r.id); refresh();
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
          <ModalActions onCancel={() => setEditing(null)} onSave={save} t={t} />
        </Modal>
      )}
    </div>
  );
}

/* ---------------- ABOUT CARDS ---------------- */
type AboutRow = { id: string; icon: string; title_ar: string; title_he: string; text_ar: string; text_he: string; sort_order: number; is_active: boolean };
function AboutPanel() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<AboutRow> | null>(null);
  const { data = [] } = useQuery({
    queryKey: ["about-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("about_cards" as never).select("*").order("sort_order");
      if (error) throw error;
      return data as unknown as AboutRow[];
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["about-admin"] }); qc.invalidateQueries({ queryKey: ["about-cards-public"] }); };
  async function save() {
    if (!editing) return;
    const payload = {
      icon: editing.icon?.trim() || "Sparkles",
      title_ar: editing.title_ar?.trim() || "", title_he: editing.title_he?.trim() || "",
      text_ar: editing.text_ar?.trim() || "", text_he: editing.text_he?.trim() || "",
      sort_order: Number(editing.sort_order) || 0, is_active: editing.is_active ?? true,
    };
    if (!payload.title_ar || !payload.title_he) return toast.error(t("required"));
    const { error } = editing.id
      ? await supabase.from("about_cards" as never).update(payload as never).eq("id", editing.id)
      : await supabase.from("about_cards" as never).insert(payload as never);
    if (error) return toast.error(error.message);
    refresh(); setEditing(null); toast.success(t("success"));
  }
  async function remove(id: string) {
    if (!confirm(lang === "ar" ? "حذف؟" : "למחוק?")) return;
    await supabase.from("about_cards" as never).delete().eq("id", id); refresh();
  }
  async function move(i: number, dir: -1 | 1) {
    const b = data[i + dir]; const a = data[i]; if (!a || !b) return;
    await swapOrder("about_cards", a, b); refresh();
  }
  async function toggleActive(r: AboutRow) {
    await supabase.from("about_cards" as never).update({ is_active: !r.is_active } as never).eq("id", r.id); refresh();
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
          <ModalActions onCancel={() => setEditing(null)} onSave={save} t={t} />
        </Modal>
      )}
    </div>
  );
}

/* ---------------- TESTIMONIALS ---------------- */
type TestimonialRow = { id: string; name: string; text_ar: string; text_he: string; rating: number; sort_order: number; is_active: boolean };
function TestimonialsPanel() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<TestimonialRow> | null>(null);
  const { data = [] } = useQuery({
    queryKey: ["testimonials-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("testimonials" as never).select("*").order("sort_order");
      if (error) throw error;
      return data as unknown as TestimonialRow[];
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["testimonials-admin"] }); qc.invalidateQueries({ queryKey: ["testimonials-public"] }); };
  async function save() {
    if (!editing) return;
    const payload = {
      name: editing.name?.trim() || "",
      text_ar: editing.text_ar?.trim() || "", text_he: editing.text_he?.trim() || "",
      rating: Math.min(5, Math.max(1, Number(editing.rating) || 5)),
      sort_order: Number(editing.sort_order) || 0, is_active: editing.is_active ?? true,
    };
    if (!payload.name || !payload.text_ar || !payload.text_he) return toast.error(t("required"));
    const { error } = editing.id
      ? await supabase.from("testimonials" as never).update(payload as never).eq("id", editing.id)
      : await supabase.from("testimonials" as never).insert(payload as never);
    if (error) return toast.error(error.message);
    refresh(); setEditing(null); toast.success(t("success"));
  }
  async function remove(id: string) {
    if (!confirm(lang === "ar" ? "حذف؟" : "למחוק?")) return;
    await supabase.from("testimonials" as never).delete().eq("id", id); refresh();
  }
  async function move(i: number, dir: -1 | 1) {
    const b = data[i + dir]; const a = data[i]; if (!a || !b) return;
    await swapOrder("testimonials", a, b); refresh();
  }
  async function toggleActive(r: TestimonialRow) {
    await supabase.from("testimonials" as never).update({ is_active: !r.is_active } as never).eq("id", r.id); refresh();
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
          <ModalActions onCancel={() => setEditing(null)} onSave={save} t={t} />
        </Modal>
      )}
    </div>
  );
}

/* ---------------- FAQ ---------------- */
type FaqRow = { id: string; question_ar: string; question_he: string; answer_ar: string; answer_he: string; sort_order: number; is_active: boolean };
function FaqPanel() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<FaqRow> | null>(null);
  const { data = [] } = useQuery({
    queryKey: ["faqs-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("faqs" as never).select("*").order("sort_order");
      if (error) throw error;
      return data as unknown as FaqRow[];
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["faqs-admin"] }); qc.invalidateQueries({ queryKey: ["faqs-public"] }); };
  async function save() {
    if (!editing) return;
    const payload = {
      question_ar: editing.question_ar?.trim() || "", question_he: editing.question_he?.trim() || "",
      answer_ar: editing.answer_ar?.trim() || "", answer_he: editing.answer_he?.trim() || "",
      sort_order: Number(editing.sort_order) || 0, is_active: editing.is_active ?? true,
    };
    if (!payload.question_ar || !payload.question_he) return toast.error(t("required"));
    const { error } = editing.id
      ? await supabase.from("faqs" as never).update(payload as never).eq("id", editing.id)
      : await supabase.from("faqs" as never).insert(payload as never);
    if (error) return toast.error(error.message);
    refresh(); setEditing(null); toast.success(t("success"));
  }
  async function remove(id: string) {
    if (!confirm(lang === "ar" ? "حذف؟" : "למחוק?")) return;
    await supabase.from("faqs" as never).delete().eq("id", id); refresh();
  }
  async function move(i: number, dir: -1 | 1) {
    const b = data[i + dir]; const a = data[i]; if (!a || !b) return;
    await swapOrder("faqs", a, b); refresh();
  }
  async function toggleActive(r: FaqRow) {
    await supabase.from("faqs" as never).update({ is_active: !r.is_active } as never).eq("id", r.id); refresh();
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
          <ModalActions onCancel={() => setEditing(null)} onSave={save} t={t} />
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Modal helper ---------------- */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg space-y-3 overflow-auto rounded-3xl bg-card p-6 shadow-2xl">
        <h3 className="text-lg font-bold">{title}</h3>
        {children}
      </div>
    </div>
  );
}
function ModalActions({ onCancel, onSave, t }: { onCancel: () => void; onSave: () => void; t: (k: "cancel" | "save") => string }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button onClick={onCancel} className="rounded-lg border border-border px-4 py-2 text-sm">{t("cancel")}</button>
      <button onClick={onSave} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">{t("save")}</button>
    </div>
  );
}

/* ---------------- HOURS ---------------- */
type Hours = { id: string; day_of_week: number; is_closed: boolean; open_time: string; close_time: string; slot_step_minutes: number };
function HoursPanel() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["business-hours"],
    queryFn: async () => {
      const { data, error } = await supabase.from("business_hours").select("*").order("day_of_week");
      if (error) throw error;
      return data as Hours[];
    },
  });
  async function update(h: Hours, patch: Partial<Hours>) {
    const { error } = await supabase.from("business_hours").update(patch).eq("id", h.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["business-hours"] });
    qc.invalidateQueries({ queryKey: ["slots"] });
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
type Block = { id: string; start_at: string; end_at: string; reason: string | null };
function BlocksPanel() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const [form, setForm] = useState({ date: "", start: "", end: "", reason: "" });
  const { data = [] } = useQuery({
    queryKey: ["blocked-slots"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blocked_slots").select("*").gte("end_at", new Date().toISOString()).order("start_at");
      if (error) throw error;
      return data as Block[];
    },
  });
  async function add() {
    if (!form.date || !form.start || !form.end) return toast.error(t("required"));
    const start = new Date(`${form.date}T${form.start}:00`);
    const end = new Date(`${form.date}T${form.end}:00`);
    if (end <= start) return toast.error(lang === "ar" ? "نهاية بعد البداية" : "סיום אחרי התחלה");
    const { error } = await supabase.from("blocked_slots").insert({ start_at: start.toISOString(), end_at: end.toISOString(), reason: form.reason.trim() || null });
    if (error) return toast.error(error.message);
    setForm({ date: "", start: "", end: "", reason: "" });
    qc.invalidateQueries({ queryKey: ["blocked-slots"] });
    qc.invalidateQueries({ queryKey: ["slots"] });
    toast.success(t("success"));
  }
  async function remove(id: string) {
    const { error } = await supabase.from("blocked_slots").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["blocked-slots"] });
    qc.invalidateQueries({ queryKey: ["slots"] });
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
type GalleryRow = { id: string; media_type: "image" | "video"; storage_path: string | null; media_url: string; caption: string | null; sort_order: number; is_active: boolean };
function GalleryPanel() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const { data = [] } = useQuery({
    queryKey: ["gallery-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gallery_items").select("*").order("sort_order").order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data || []) as GalleryRow[];
      await Promise.all(rows.map(async (r) => {
        if (r.storage_path) {
          const { data: signed } = await supabase.storage.from("gallery").createSignedUrl(r.storage_path, 60 * 60);
          if (signed?.signedUrl) r.media_url = signed.signedUrl;
        }
      }));
      return rows;
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["gallery-admin"] }); qc.invalidateQueries({ queryKey: ["gallery-public"] }); };

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) return toast.error(lang === "ar" ? "اختاري صورة أو فيديو" : "בחרי תמונה או סרטון");
    if (file.size > 50 * 1024 * 1024) return toast.error(lang === "ar" ? "الحجم الأقصى 50MB" : "מקסימום 50MB");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("gallery").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("gallery_items").insert({
        media_type: isVideo ? "video" : "image", storage_path: path, media_url: path,
        caption: caption.trim() || null, sort_order: data.length,
      });
      if (insErr) throw insErr;
      setCaption(""); refresh(); toast.success(t("success"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error"));
    } finally {
      setUploading(false);
    }
  }
  async function toggleActive(r: GalleryRow) {
    await supabase.from("gallery_items").update({ is_active: !r.is_active }).eq("id", r.id); refresh();
  }
  async function remove(r: GalleryRow) {
    if (!confirm(lang === "ar" ? "حذف العنصر؟" : "למחוק את הפריט?")) return;
    if (r.storage_path) await supabase.storage.from("gallery").remove([r.storage_path]);
    await supabase.from("gallery_items").delete().eq("id", r.id); refresh();
  }
  async function move(i: number, dir: -1 | 1) {
    const b = data[i + dir]; const a = data[i]; if (!a || !b) return;
    await swapOrder("gallery_items", a, b); refresh();
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
