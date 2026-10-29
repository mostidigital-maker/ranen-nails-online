import { useEffect } from "react";
import { useSiteSettings } from "@/features/settings/hooks";

/**
 * Injects third-party analytics snippets when the matching ID is configured
 * in Admin → Site Settings → Analytics. Nothing is loaded when the field is
 * empty, so a fresh install ships with zero third-party requests.
 */
function injectScript(id: string, src?: string, inline?: string) {
  if (typeof document === "undefined") return;
  if (document.getElementById(id)) return;
  const el = document.createElement("script");
  el.id = id;
  el.async = true;
  if (src) el.src = src;
  if (inline) el.innerHTML = inline;
  document.head.appendChild(el);
}

export function AnalyticsScripts() {
  const { data: s } = useSiteSettings();

  useEffect(() => {
    if (!s) return;

    // --- SEO: title / description / keywords driven by Site Settings ---
    const setMeta = (attr: "name" | "property", key: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.content = content;
    };
    const title = s.seo_title || s.business_name_ar;
    if (title) {
      document.title = title;
      setMeta("property", "og:title", title);
      setMeta("name", "twitter:title", title);
    }
    if (s.seo_description) {
      setMeta("name", "description", s.seo_description);
      setMeta("property", "og:description", s.seo_description);
      setMeta("name", "twitter:description", s.seo_description);
    }
    document.documentElement.dataset.theme = s.theme_preset || "rose";
    if (s.seo_keywords) setMeta("name", "keywords", s.seo_keywords);
    if (s.og_image_url) {
      setMeta("property", "og:image", s.og_image_url);
      setMeta("name", "twitter:image", s.og_image_url);
    }


    if (s.ga_measurement_id) {
      injectScript("ga-src", `https://www.googletagmanager.com/gtag/js?id=${s.ga_measurement_id}`);
      injectScript(
        "ga-init",
        undefined,
        `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${s.ga_measurement_id}');`,
      );
    }

    if (s.gtm_id) {
      injectScript(
        "gtm-init",
        undefined,
        `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${s.gtm_id}');`,
      );
    }

    if (s.meta_pixel_id) {
      injectScript(
        "meta-pixel",
        undefined,
        `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${s.meta_pixel_id}');fbq('track','PageView');`,
      );
    }

    if (s.tiktok_pixel_id) {
      injectScript(
        "tiktok-pixel",
        undefined,
        `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript";o.async=!0;o.src=r+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${s.tiktok_pixel_id}');ttq.page();}(window,document,'ttq');`,
      );
    }

    if (s.google_site_verification && !document.querySelector('meta[name="google-site-verification"]')) {
      const m = document.createElement("meta");
      m.name = "google-site-verification";
      m.content = s.google_site_verification;
      document.head.appendChild(m);
    }

    if (s.favicon_url) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = s.favicon_url;
    }
  }, [s]);

  return null;
}
