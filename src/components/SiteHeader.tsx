import { Link } from "@tanstack/react-router";
import { useLang, type Lang } from "@/lib/i18n";
import { useSiteSettings } from "@/lib/site";
import { Sparkles, Globe } from "lucide-react";

export function SiteHeader() {
  const { t, lang, setLang } = useLang();
  const { data: settings } = useSiteSettings();
  const brand = settings ? (lang === "ar" ? settings.business_name_ar : settings.business_name_he) : t("brand");
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-md" style={{ background: "var(--gradient-primary)" }}>
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              <Sparkles className="h-5 w-5 text-white" />
            )}
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-lg font-bold">{brand}</div>
            {settings?.brand_latin && (
              <div className="text-[10px] tracking-widest text-muted-foreground">{settings.brand_latin}</div>
            )}
          </div>

        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang((lang === "ar" ? "he" : "ar") as Lang)}
            aria-label={lang === "ar" ? "עברית" : "العربية"}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm transition hover:border-primary hover:text-primary"
          >
            <Globe className="h-3.5 w-3.5" aria-hidden="true" />
            {t("switchLang")}
          </button>

        </div>
      </div>
    </header>
  );
}
