import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang, RENIN_PHONE } from "@/lib/i18n";
import { SiteHeader } from "@/components/SiteHeader";
import { MapPin, Clock, Phone, Sparkles, Calendar, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getAvailableSlots } from "@/lib/availability";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "رنين نيلز | Ranen Nails - كفر دير الأسد" },
      { name: "description", content: "صالون رنين نيلز للعناية بالأظافر والحواجب. بناء أظافر، لاك جل، أكريل، تصميم حواجب. احجزي موعدك أونلاين." },
    ],
  }),
  component: Index,
});

type Service = {
  id: string;
  name_ar: string;
  name_he: string;
  price: number;
  duration_minutes: number;
};

function Index() {
  const { t, lang } = useLang();

  const { data: services = [] } = useQuery({
    queryKey: ["services-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id,name_ar,name_he,price,duration_minutes")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data as Service[];
    },
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-12 pb-16 text-center">
        <div className="absolute inset-0 -z-10 opacity-30" style={{ background: "var(--gradient-primary)", filter: "blur(80px)" }} />
        <div className="mx-auto max-w-3xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full shadow-lg" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
            <Sparkles className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">{t("brand")}</h1>
          <p className="mt-3 text-lg md:text-xl text-muted-foreground">{t("tagline")}</p>
          <div className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{t("location")}</span>
          </div>
          <a
            href="#booking"
            className="mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-bold text-primary-foreground shadow-lg transition hover:scale-105"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-soft)" }}
          >
            <Calendar className="h-5 w-5" />
            {t("bookNow")}
          </a>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-2">{t("services")}</h2>
          <div className="mx-auto mb-10 h-1 w-16 rounded-full" style={{ background: "var(--gradient-primary)" }} />
          <div className="grid gap-4 md:grid-cols-2">
            {services.map((s) => (
              <div key={s.id} className="group rounded-2xl border border-border bg-card p-6 transition hover:border-primary hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold">{lang === "ar" ? s.name_ar : s.name_he}</h3>
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {s.duration_minutes} {t("minutes")}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="text-3xl font-black text-primary">{s.price}</div>
                    <div className="text-xs text-muted-foreground">{t("currency")}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold mb-3">{t("about")}</h2>
          <p className="text-muted-foreground leading-relaxed">{t("aboutText")}</p>
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl bg-muted/50 p-3">
              <Clock className="mx-auto mb-1 h-4 w-4 text-primary" />
              <div className="font-semibold">{t("workingHours")}</div>
              <div className="text-xs text-muted-foreground mt-1">{t("hoursValue")}</div>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <MapPin className="mx-auto mb-1 h-4 w-4 text-primary" />
              <div className="font-semibold">{t("location")}</div>
              <a href={`tel:0502204606`} className="mt-1 flex items-center justify-center gap-1 text-xs text-primary">
                <Phone className="h-3 w-3" /> 050-220-4606
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Booking */}
      <BookingForm services={services} />

      <footer className="border-t border-border/50 px-4 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {t("brand")} · {t("location")}
      </footer>
    </div>
  );
}

function BookingForm({ services }: { services: Service[] }) {
  const { t, lang } = useLang();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    serviceId: "",
    date: "",
    time: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const selectedService = useMemo(() => services.find((s) => s.id === form.serviceId), [services, form.serviceId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone || !form.serviceId || !form.date || !form.time) {
      toast.error(t("required"));
      return;
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

    if (error) {
      toast.error(t("error") + ": " + error.message);
      return;
    }

    // Open WhatsApp to Renin with details
    const msg =
      lang === "ar"
        ? `حجز جديد 💅\nالاسم: ${form.name}\nالهاتف: ${form.phone}\nالخدمة: ${service.name_ar}\nالسعر: ${service.price}₪\nالتاريخ: ${form.date}\nالوقت: ${form.time}${form.notes ? `\nملاحظات: ${form.notes}` : ""}`
        : `תור חדש 💅\nשם: ${form.name}\nטלפון: ${form.phone}\nשירות: ${service.name_he}\nמחיר: ${service.price}₪\nתאריך: ${form.date}\nשעה: ${form.time}${form.notes ? `\nהערות: ${form.notes}` : ""}`;

    const url = `https://wa.me/${RENIN_PHONE}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    toast.success(t("bookingSent"));
    setSuccess(true);
    setForm({ name: "", phone: "", serviceId: "", date: "", time: "", notes: "" });
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <section id="booking" className="px-4 py-12">
      <div className="mx-auto max-w-xl">
        <h2 className="text-3xl font-bold text-center mb-2">{t("bookingTitle")}</h2>
        <div className="mx-auto mb-8 h-1 w-16 rounded-full" style={{ background: "var(--gradient-primary)" }} />

        <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <Field label={t("name")}>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </Field>
          <Field label={t("phone")}>
            <input
              type="tel"
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
              placeholder="050-000-0000"
            />
          </Field>
          <Field label={t("service")}>
            <select
              className="input"
              value={form.serviceId}
              onChange={(e) => setForm({ ...form, serviceId: e.target.value, time: "" })}
              required
            >
              <option value="">{t("selectService")}</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {(lang === "ar" ? s.name_ar : s.name_he)} — {s.price}₪
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("date")}>
              <input
                type="date"
                min={today}
                className="input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value, time: "" })}
                required
              />
            </Field>
            <Field label={t("time")}>
              <SlotPicker
                date={form.date}
                duration={selectedService?.duration_minutes || 0}
                value={form.time}
                onChange={(v) => setForm({ ...form, time: v })}
              />
            </Field>
          </div>
          <Field label={t("notes")}>
            <textarea
              className="input min-h-[80px]"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl py-3.5 font-bold text-primary-foreground shadow-lg transition hover:scale-[1.01] disabled:opacity-60"
            style={{ background: "var(--gradient-primary)" }}
          >
            {submitting ? "..." : t("submit")}
          </button>

          {success && (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 p-3 text-sm text-primary">
              <CheckCircle2 className="h-4 w-4" />
              {t("bookingSent")}
            </div>
          )}
        </form>

        <style>{`
          .input {
            width: 100%;
            border: 1px solid var(--color-border);
            background: var(--color-background);
            border-radius: 0.75rem;
            padding: 0.7rem 0.9rem;
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
