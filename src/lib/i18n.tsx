import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ar" | "he";

type Dict = Record<string, { ar: string; he: string }>;

const T = {
  // Neutral fallbacks — every one of these is overridden by Site Settings.
  brand: { ar: "صالون التجميل", he: "סלון היופי" },
  tagline: { ar: "جمالك يبدأ من هنا", he: "היופי שלך מתחיל כאן" },
  location: { ar: "العنوان", he: "כתובת" },
  bookNow: { ar: "احجزي موعدك", he: "קבעי תור" },
  viewGallery: { ar: "شاهدي أعمالنا", he: "צפי בעבודות" },
  services: { ar: "خدماتنا", he: "השירותים שלנו" },
  servicesSubtitle: { ar: "خدمات مختارة بعناية لكِ", he: "שירותים נבחרים במיוחד עבורך" },
  about: { ar: "عن الصالون", he: "על הסלון" },
  aboutText: {
    ar: "أناقة، نظافة ولمسة فنية في كل تفصيل.",
    he: "אלגנטיות, ניקיון ומגע אומנותי בכל פרט.",
  },
  contact: { ar: "تواصلي معنا", he: "צרי קשר" },
  workingHours: { ar: "ساعات العمل", he: "שעות פעילות" },
  hoursValue: {
    ar: "حسب ساعات العمل",
    he: "לפי שעות הפעילות",
  },

  bookingTitle: { ar: "احجزي موعدك الآن", he: "קביעת תור" },
  name: { ar: "الاسم الكامل", he: "שם מלא" },
  phone: { ar: "رقم الهاتف", he: "מספר טלפון" },
  service: { ar: "الخدمة", he: "השירות" },
  selectService: { ar: "اختاري الخدمة", he: "בחרי שירות" },
  date: { ar: "التاريخ", he: "תאריך" },
  time: { ar: "الوقت", he: "שעה" },
  notes: { ar: "ملاحظات (اختياري)", he: "הערות (לא חובה)" },
  submit: { ar: "إرسال الطلب عبر واتساب", he: "שלחי בקשה בוואטסאפ" },
  duration: { ar: "المدة", he: "משך" },
  minutes: { ar: "دقيقة", he: "דקות" },
  price: { ar: "السعر", he: "מחיר" },
  currency: { ar: "₪", he: "₪" },
  admin: { ar: "إدارة", he: "ניהול" },
  login: { ar: "تسجيل دخول", he: "התחברות" },
  logout: { ar: "خروج", he: "התנתקות" },
  email: { ar: "البريد الإلكتروني", he: 'דוא"ל' },
  password: { ar: "كلمة المرور", he: "סיסמה" },
  dashboard: { ar: "لوحة التحكم", he: "לוח בקרה" },
  appointments: { ar: "المواعيد", he: "תורים" },
  manageServices: { ar: "إدارة الخدمات", he: "ניהול שירותים" },
  pending: { ar: "بانتظار التأكيد", he: "ממתין" },
  confirmed: { ar: "مؤكد", he: "מאושר" },
  cancelled: { ar: "ملغى", he: "מבוטל" },
  confirm: { ar: "تأكيد", he: "אישור" },
  cancel: { ar: "إلغاء", he: "ביטול" },
  delete: { ar: "حذف", he: "מחיקה" },
  add: { ar: "إضافة", he: "הוספה" },
  save: { ar: "حفظ", he: "שמירה" },
  edit: { ar: "تعديل", he: "עריכה" },
  nameAr: { ar: "الاسم بالعربية", he: "שם בערבית" },
  nameHe: { ar: "الاسم بالعبرية", he: "שם בעברית" },
  descriptionAr: { ar: "الوصف بالعربية", he: "תיאור בערבית" },
  descriptionHe: { ar: "الوصف بالعبرية", he: "תיאור בעברית" },
  active: { ar: "مفعّل", he: "פעיל" },
  noAppointments: { ar: "لا توجد مواعيد", he: "אין תורים" },
  required: { ar: "حقل مطلوب", he: "שדה חובה" },
  bookingSent: { ar: "تم إرسال طلب الحجز عبر واتساب!", he: "הבקשה נשלחה בוואטסאפ!" },
  success: { ar: "تم بنجاح", he: "בוצע בהצלחה" },
  error: { ar: "حدث خطأ", he: "אירעה שגיאה" },
  sendWhatsapp: { ar: "إرسال واتساب", he: "שליחת וואטסאפ" },
  switchLang: { ar: "עברית", he: "العربية" },
  availableTimes: { ar: "الأوقات المتاحة", he: "זמנים פנויים" },
  pickDateService: { ar: "اختاري التاريخ والخدمة أولاً", he: "בחרי תאריך ושירות תחילה" },
  noSlots: { ar: "لا توجد أوقات متاحة في هذا اليوم", he: "אין זמנים פנויים ביום זה" },
  loadingSlots: { ar: "جاري التحميل...", he: "טוען..." },
  closedDay: { ar: "الصالون مغلق في هذا اليوم", he: "הסלון סגור ביום זה" },
  hours: { ar: "ساعات العمل", he: "שעות פעילות" },
  blocks: { ar: "أوقات محجوبة", he: "זמנים חסומים" },
  closed: { ar: "مغلق", he: "סגור" },
  open: { ar: "مفتوح", he: "פתוח" },
  from: { ar: "من", he: "מ" },
  to: { ar: "إلى", he: "עד" },
  step: { ar: "فترة (دقائق)", he: "מרווח (דק׳)" },
  addBlock: { ar: "إضافة حجب", he: "הוסיפי חסימה" },
  reason: { ar: "السبب", he: "סיבה" },
  day0: { ar: "الأحد", he: "ראשון" },
  day1: { ar: "الإثنين", he: "שני" },
  day2: { ar: "الثلاثاء", he: "שלישי" },
  day3: { ar: "الأربعاء", he: "רביעי" },
  day4: { ar: "الخميس", he: "חמישי" },
  day5: { ar: "الجمعة", he: "שישי" },
  day6: { ar: "السبت", he: "שבת" },
  gallery: { ar: "معرض الأعمال", he: "גלריית עבודות" },
  galleryEmpty: { ar: "لا توجد صور أو فيديوهات بعد", he: "אין תמונות או סרטונים עדיין" },
  uploadMedia: { ar: "رفع صورة أو فيديو", he: "העלאת תמונה או סרטון" },
  uploading: { ar: "جاري الرفع...", he: "מעלה..." },
  caption: { ar: "وصف (اختياري)", he: "תיאור (לא חובה)" },
  image: { ar: "صورة", he: "תמונה" },
  video: { ar: "فيديو", he: "סרטון" },
  // new keys
  testimonials: { ar: "آراء عميلاتنا", he: "המלצות לקוחות" },
  faq: { ar: "أسئلة شائعة", he: "שאלות נפוצות" },
  stats: { ar: "إحصائيات", he: "סטטיסטיקות" },
  aboutCards: { ar: "بطاقات عن الصالون", he: "כרטיסי אודות" },
  settings: { ar: "إعدادات الموقع", he: "הגדרות האתר" },
  siteContent: { ar: "محتوى الموقع", he: "תוכן האתר" },
  whatsapp: { ar: "واتساب", he: "וואטסאפ" },
  instagram: { ar: "انستغرام", he: "אינסטגרם" },
  address: { ar: "العنوان", he: "כתובת" },
  navigate: { ar: "الاتجاهات", he: "ניווט" },
  callNow: { ar: "اتصلي الآن", he: "התקשרי עכשיו" },
  moveUp: { ar: "أعلى", he: "למעלה" },
  moveDown: { ar: "أسفل", he: "למטה" },
  rating: { ar: "التقييم", he: "דירוג" },
  question: { ar: "السؤال", he: "שאלה" },
  answer: { ar: "الإجابة", he: "תשובה" },
  icon: { ar: "أيقونة", he: "אייקון" },
  title: { ar: "العنوان", he: "כותרת" },
  description: { ar: "الوصف", he: "תיאור" },
  value: { ar: "القيمة", he: "ערך" },
  suffix: { ar: "لاحقة", he: "סיומת" },
  label: { ar: "التسمية", he: "תווית" },
  footer: { ar: "التذييل", he: "פוטר" },
  logoUrl: { ar: "رابط الشعار", he: "כתובת לוגו" },
  heroImage: { ar: "صورة الغلاف", he: "תמונת רקע ראשית" },
  reviewText: { ar: "نص التقييم", he: "טקסט ההמלצה" },
  customerName: { ar: "اسم العميلة", he: "שם הלקוחה" },
  followUs: { ar: "تابعينا", he: "עקבי אחרינו" },
  quickLinks: { ar: "روابط سريعة", he: "קישורים מהירים" },
  allRightsReserved: { ar: "جميع الحقوق محفوظة", he: "כל הזכויות שמורות" },
  // CMS / admin
  categories: { ar: "تصنيفات الخدمات", he: "קטגוריות שירות" },
  category: { ar: "التصنيف", he: "קטגוריה" },
  noCategory: { ar: "بدون تصنيف", he: "ללא קטגוריה" },
  slug: { ar: "المعرّف (slug)", he: "מזהה (slug)" },
  imageUrl: { ar: "رابط الصورة", he: "כתובת תמונה" },
  photoUrl: { ar: "رابط صورة العميلة", he: "כתובת תמונת הלקוחה" },
  beforeAfter: { ar: "قبل / بعد", he: "לפני / אחרי" },
  general: { ar: "عام", he: "כללי" },
  business: { ar: "إعدادات العمل", he: "הגדרות עסק" },
  booking: { ar: "الحجز", he: "הזמנות" },
  bookingEnabled: { ar: "تفعيل الحجز أونلاين", he: "אפשר קביעת תור אונליין" },
  bookingDisabledMsg: { ar: "الحجز أونلاين غير متاح حالياً، تواصلي معنا مباشرة.", he: "קביעת תור אונליין אינה זמינה כעת, צרי קשר ישירות." },
  maxDaysAhead: { ar: "أقصى عدد أيام مسبقاً", he: "מקסימום ימים מראש" },
  minNotice: { ar: "أقل مهلة (دقائق)", he: "התראה מינימלית (דקות)" },
  slotInterval: { ar: "فاصل المواعيد (دقائق، 0 = حسب ساعات العمل)", he: "מרווח תורים (דקות, 0 = לפי שעות פעילות)" },
  currencySymbol: { ar: "رمز العملة", he: "סמל מטבע" },
  timezone: { ar: "المنطقة الزمنية", he: "אזור זמן" },
  seo: { ar: "تحسين محركات البحث (SEO)", he: "SEO" },
  seoTitle: { ar: "عنوان SEO", he: "כותרת SEO" },
  seoDescription: { ar: "وصف SEO", he: "תיאור SEO" },
  seoKeywords: { ar: "كلمات مفتاحية", he: "מילות מפתח" },
  favicon: { ar: "أيقونة الموقع (Favicon)", he: "Favicon" },
  ogImage: { ar: "صورة المشاركة (OG)", he: "תמונת שיתוף (OG)" },
  analytics: { ar: "التحليلات", he: "אנליטיקס" },
  payments: { ar: "المدفوعات", he: "תשלומים" },
  paymentsEnabled: { ar: "تفعيل المدفوعات", he: "הפעלת תשלומים" },
  provider: { ar: "المزوّد", he: "ספק" },
  publicKey: { ar: "المفتاح العام", he: "מפתח ציבורי" },
  secretKey: { ar: "المفتاح السري", he: "מפתח סודי" },
  successUrl: { ar: "رابط النجاح", he: "כתובת הצלחה" },
  cancelUrl: { ar: "رابط الإلغاء", he: "כתובת ביטול" },
  mode: { ar: "الوضع", he: "מצב" },
  sandbox: { ar: "تجريبي", he: "בדיקות" },
  production: { ar: "إنتاج", he: "ייצור" },
  social: { ar: "شبكات التواصل", he: "רשתות חברתיות" },
  facebook: { ar: "فيسبوك", he: "פייסבוק" },
  tiktok: { ar: "تيك توك", he: "טיקטוק" },
  youtube: { ar: "يوتيوب", he: "יוטיוב" },
  notIntegratedYet: { ar: "الإعدادات محفوظة فقط — لم يتم ربط أي مزوّد بعد.", he: "ההגדרות נשמרות בלבד — טרם חובר ספק." },
  brandLatin: { ar: "الاسم اللاتيني (تحت الشعار)", he: "שם לטיני (מתחת ללוגו)" },
} satisfies Dict;


export type TKey = keyof typeof T;

interface Ctx {
  lang: Lang;
  dir: "rtl";
  setLang: (l: Lang) => void;
  t: (k: TKey) => string;
}

const LangCtx = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && (localStorage.getItem("lang") as Lang)) || "ar";
    setLangState(saved);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = "rtl";
    }
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };

  const t = (k: TKey) => T[k][lang];

  return <LangCtx.Provider value={{ lang, dir: "rtl", setLang, t }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  const ctx = useContext(LangCtx);
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider");
  return ctx;
}

