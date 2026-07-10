import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang, RENIN_PHONE } from "@/lib/i18n";
import { SiteHeader } from "@/components/SiteHeader";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Trash2, Plus, MessageCircle, Calendar, Settings, LogOut, Pencil, Clock, Ban, Image as ImageIcon, Upload } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "لوحة التحكم | رنين نيلز" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type Appointment = {
  id: string;
  client_name: string;
  client_phone: string;
  service_name: string;
  service_price: number;
  appointment_at: string;
  status: "pending" | "confirmed" | "cancelled";
  notes: string | null;
};

type Service = {
  id: string;
  name_ar: string;
  name_he: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  sort_order: number;
};

function AdminPage() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"appointments" | "services" | "hours" | "blocks" | "gallery">("appointments");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id)
        .eq("role", "admin")
        .maybeSingle();
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
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-destructive">{lang === "ar" ? "غير مصرح" : "אין הרשאה"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{lang === "ar" ? "هذا الحساب ليس مديراً." : "החשבון אינו אדמין."}</p>
          <button onClick={signOut} className="mt-4 rounded-lg bg-primary px-4 py-2 text-primary-foreground">{t("logout")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{t("dashboard")}</h1>
          <div className="flex items-center gap-2">
            <Link to="/" className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:border-primary">{lang === "ar" ? "الموقع" : "האתר"}</Link>
            <button onClick={signOut} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:border-destructive hover:text-destructive">
              <LogOut className="h-3.5 w-3.5" />{t("logout")}
            </button>
          </div>
        </div>

        <div className="mt-6 inline-flex flex-wrap rounded-xl border border-border bg-card p-1">
          {(["appointments", "services", "gallery", "hours", "blocks"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {k === "appointments" ? <Calendar className="h-4 w-4" /> : k === "services" ? <Settings className="h-4 w-4" /> : k === "gallery" ? <ImageIcon className="h-4 w-4" /> : k === "hours" ? <Clock className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
              {t(k === "appointments" ? "appointments" : k === "services" ? "manageServices" : k === "gallery" ? "gallery" : k === "hours" ? "hours" : "blocks")}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "appointments" ? <AppointmentsPanel /> : tab === "services" ? <ServicesPanel /> : tab === "gallery" ? <GalleryPanel /> : tab === "hours" ? <HoursPanel /> : <BlocksPanel />}
        </div>
      </div>
    </div>
  );
}

function AppointmentsPanel() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("appointment_at", { ascending: true });
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

    // Open WhatsApp to client
    const dt = new Date(a.appointment_at);
    const dateStr = dt.toLocaleDateString(lang === "ar" ? "ar" : "he");
    const timeStr = dt.toLocaleTimeString(lang === "ar" ? "ar" : "he", { hour: "2-digit", minute: "2-digit" });

    const msg = status === "confirmed"
      ? (lang === "ar"
          ? `مرحباً ${a.client_name} 💕\nتم تأكيد موعدك في رنين نيلز:\nالخدمة: ${a.service_name}\nالتاريخ: ${dateStr}\nالوقت: ${timeStr}\nبانتظارك!`
          : `שלום ${a.client_name} 💕\nהתור שלך ברנין ניילז אושר:\nשירות: ${a.service_name}\nתאריך: ${dateStr}\nשעה: ${timeStr}\nמחכה לך!`)
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

  if (isLoading) return <div className="text-center text-muted-foreground py-8">...</div>;
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
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">{a.client_name}</h3>
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${statusStyle[a.status]}`}>{t(a.status)}</span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  📞 {a.client_phone} · 💅 {a.service_name} · {a.service_price}₪
                </div>
                <div className="mt-1 text-sm font-medium">
                  📅 {dt.toLocaleDateString(lang === "ar" ? "ar" : "he")} —{" "}
                  {dt.toLocaleTimeString(lang === "ar" ? "ar" : "he", { hour: "2-digit", minute: "2-digit" })}
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
                <a
                  href={`https://wa.me/${a.client_phone.replace(/\D/g, "").replace(/^0/, "972")}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:border-primary"
                >
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

function ServicesPanel() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Service> | null>(null);

  const { data = [] } = useQuery({
    queryKey: ["services-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("sort_order");
      if (error) throw error;
      return data as Service[];
    },
  });

  async function save() {
    if (!editing) return;
    const payload = {
      name_ar: editing.name_ar?.trim() || "",
      name_he: editing.name_he?.trim() || "",
      price: Number(editing.price) || 0,
      duration_minutes: Number(editing.duration_minutes) || 60,
      is_active: editing.is_active ?? true,
      sort_order: Number(editing.sort_order) || 0,
    };
    if (!payload.name_ar || !payload.name_he || !payload.price) return toast.error(t("required"));

    const { error } = editing.id
      ? await supabase.from("services").update(payload).eq("id", editing.id)
      : await supabase.from("services").insert(payload);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["services-admin"] });
    qc.invalidateQueries({ queryKey: ["services-public"] });
    setEditing(null);
    toast.success(t("success"));
  }

  async function remove(id: string) {
    if (!confirm(lang === "ar" ? "حذف الخدمة؟" : "למחוק את השירות?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["services-admin"] });
    qc.invalidateQueries({ queryKey: ["services-public"] });
  }

  async function toggleActive(s: Service) {
    const { error } = await supabase.from("services").update({ is_active: !s.is_active }).eq("id", s.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["services-admin"] });
    qc.invalidateQueries({ queryKey: ["services-public"] });
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setEditing({ name_ar: "", name_he: "", price: 0, duration_minutes: 60, is_active: true, sort_order: data.length })}
        className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold text-primary-foreground"
        style={{ background: "var(--gradient-primary)" }}
      >
        <Plus className="h-4 w-4" />{t("add")}
      </button>

      {data.map((s) => (
        <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex-1">
            <div className="font-bold">{s.name_ar} <span className="text-muted-foreground">/ {s.name_he}</span></div>
            <div className="text-sm text-muted-foreground">{s.price}₪ · {s.duration_minutes} {t("minutes")} {!s.is_active && <span className="text-destructive">· {lang === "ar" ? "متوقف" : "מושבת"}</span>}</div>
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
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-3 rounded-3xl bg-card p-6 shadow-2xl">
            <h3 className="text-lg font-bold">{editing.id ? t("edit") : t("add")}</h3>
            <Input label={t("nameAr")} value={editing.name_ar || ""} onChange={(v) => setEditing({ ...editing, name_ar: v })} />
            <Input label={t("nameHe")} value={editing.name_he || ""} onChange={(v) => setEditing({ ...editing, name_he: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label={t("price") + " ₪"} type="number" value={String(editing.price ?? "")} onChange={(v) => setEditing({ ...editing, price: Number(v) })} />
              <Input label={t("duration") + " (" + t("minutes") + ")"} type="number" value={String(editing.duration_minutes ?? "")} onChange={(v) => setEditing({ ...editing, duration_minutes: Number(v) })} />
            </div>
            <Input label={lang === "ar" ? "الترتيب" : "סדר"} type="number" value={String(editing.sort_order ?? 0)} onChange={(v) => setEditing({ ...editing, sort_order: Number(v) })} />
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

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary" />
    </label>
  );
}

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
      <p className="text-sm text-muted-foreground">{lang === "ar" ? "حدّدي ساعات عمل كل يوم. العميلات يرين فقط الأوقات الفارغة ضمن هذه الساعات." : "קבעי שעות פעילות יומיות. הלקוחות יראו רק זמנים פנויים בתוך הטווח."}</p>
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

type Block = { id: string; start_at: string; end_at: string; reason: string | null };

function BlocksPanel() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const [form, setForm] = useState({ date: "", start: "", end: "", reason: "" });

  const { data = [] } = useQuery({
    queryKey: ["blocked-slots"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blocked_slots")
        .select("*").gte("end_at", new Date().toISOString())
        .order("start_at");
      if (error) throw error;
      return data as Block[];
    },
  });

  async function add() {
    if (!form.date || !form.start || !form.end) return toast.error(t("required"));
    const start = new Date(`${form.date}T${form.start}:00`);
    const end = new Date(`${form.date}T${form.end}:00`);
    if (end <= start) return toast.error(lang === "ar" ? "نهاية بعد البداية" : "סיום אחרי התחלה");
    const { error } = await supabase.from("blocked_slots").insert({
      start_at: start.toISOString(), end_at: end.toISOString(),
      reason: form.reason.trim() || null,
    });
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

  const today = new Date().toISOString().split("T")[0];

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
        <p className="mt-2 text-xs text-muted-foreground">{today}</p>
      </div>

      {data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
          {lang === "ar" ? "لا توجد أوقات محجوبة" : "אין זמנים חסומים"}
        </div>
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

type GalleryRow = {
  id: string;
  media_type: "image" | "video";
  storage_path: string | null;
  media_url: string;
  caption: string | null;
  sort_order: number;
  is_active: boolean;
};

function GalleryPanel() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");

  const { data = [] } = useQuery({
    queryKey: ["gallery-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_items")
        .select("*")
        .order("sort_order")
        .order("created_at", { ascending: false });
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

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
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
        media_type: isVideo ? "video" : "image",
        storage_path: path,
        media_url: path,
        caption: caption.trim() || null,
        sort_order: data.length,
      });
      if (insErr) throw insErr;
      setCaption("");
      qc.invalidateQueries({ queryKey: ["gallery-admin"] });
      qc.invalidateQueries({ queryKey: ["gallery-public"] });
      toast.success(t("success"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error"));
    } finally {
      setUploading(false);
    }
  }

  async function toggleActive(r: GalleryRow) {
    const { error } = await supabase.from("gallery_items").update({ is_active: !r.is_active }).eq("id", r.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["gallery-admin"] });
    qc.invalidateQueries({ queryKey: ["gallery-public"] });
  }

  async function remove(r: GalleryRow) {
    if (!confirm(lang === "ar" ? "حذف العنصر؟" : "למחוק את הפריט?")) return;
    if (r.storage_path) {
      await supabase.storage.from("gallery").remove([r.storage_path]);
    }
    const { error } = await supabase.from("gallery_items").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["gallery-admin"] });
    qc.invalidateQueries({ queryKey: ["gallery-public"] });
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
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
          {t("galleryEmpty")}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
          {data.map((r) => (
            <div key={r.id} className={`overflow-hidden rounded-2xl border bg-card ${r.is_active ? "border-border" : "border-destructive/40 opacity-70"}`}>
              <div className="aspect-square bg-muted">
                {r.media_type === "video" ? (
                  <video src={r.media_url} controls className="h-full w-full object-cover" />
                ) : (
                  <img src={r.media_url} alt={r.caption || ""} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="p-2 text-xs">
                <div className="truncate">{r.caption || <span className="text-muted-foreground">{t(r.media_type)}</span>}</div>
                <div className="mt-2 flex gap-1">
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
