import { Link } from "@tanstack/react-router";
import { useLang, type Lang } from "@/lib/i18n";
import { Sparkles, Globe } from "lucide-react";

export function SiteHeader() {
  const { t, lang, setLang } = useLang();
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "var(--gradient-primary)" }}>
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-lg">{t("brand")}</div>
            <div className="text-[10px] text-muted-foreground">Ranen Nails</div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang((lang === "ar" ? "he" : "ar") as Lang)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-primary transition"
          >
            <Globe className="h-3.5 w-3.5" />
            {t("switchLang")}
          </button>
        </div>
      </div>
    </header>
  );
}
