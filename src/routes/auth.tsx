import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { SiteHeader } from "@/components/SiteHeader";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "تسجيل دخول | رنين نيلز" }, { name: "robots", content: "noindex" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin + "/admin" },
          });

      if (error) {
        const errorCode = (error as { code?: string }).code;
        if (errorCode === "weak_password") {
          toast.error(
            lang === "ar"
              ? "كلمة المرور التي اخترتها معروفة أو سهلة التخمين. اختاري كلمة مرور جديدة وطويلة وغير مستخدمة من قبل."
              : "הסיסמה שבחרת מוכרת כחלשה או קלה לניחוש. בחרי סיסמה חדשה, ארוכה ושלא השתמשת בה בעבר."
          );
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success(t("success"));
      if (data.session || mode === "signin") {
        await navigate({ to: "/admin" });
      } else {
        toast.message(lang === "ar" ? "افتحي بريدك لتأكيد الحساب" : "פתחי את המייל לאישור החשבון");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (lang === "ar" ? "حدث خطأ في الدخول" : "אירעה שגיאה בהתחברות"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-12">

        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-center">{t("admin")}</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            {mode === "signin"
              ? (lang === "ar" ? "ادخلي إلى لوحة التحكم" : "התחברות לפאנל ניהול")
              : (lang === "ar" ? "إنشاء حساب المالك (مرة واحدة)" : "יצירת חשבון בעלים (פעם אחת)")}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3">
            <input
              type="email" required placeholder={t("email")}
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-primary"
            />
            <input
              type="password" required minLength={12} placeholder={t("password")} autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-primary"
            />
            {mode === "signup" && (
              <p className="text-xs leading-5 text-muted-foreground">
                {lang === "ar"
                  ? "استخدمي 12 حرفاً على الأقل، ويفضّل جملة خاصة غير مستخدمة في أي موقع آخر."
                  : "השתמשי לפחות ב־12 תווים, עדיף משפט אישי שלא השתמשת בו באף אתר אחר."}
              </p>
            )}
            <button
              disabled={loading}
              className="w-full rounded-xl py-3 font-bold text-primary-foreground disabled:opacity-60"
              style={{ background: "var(--gradient-primary)" }}
            >
              {loading ? "..." : (mode === "signin" ? t("login") : (lang === "ar" ? "إنشاء حساب" : "צור חשבון"))}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-primary"
          >
            {mode === "signin"
              ? (lang === "ar" ? "أول مرة؟ أنشئي حساباً" : "פעם ראשונה? צרי חשבון")
              : (lang === "ar" ? "لدي حساب — تسجيل دخول" : "יש לי חשבון — התחברות")}
          </button>

          <Link to="/" className="mt-4 block text-center text-sm text-muted-foreground hover:text-primary">← {lang === "ar" ? "العودة للموقع" : "חזרה לאתר"}</Link>
        </div>
      </main>
    </div>

  );
}
