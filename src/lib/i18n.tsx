import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ar" | "he";

type Dict = Record<string, { ar: string; he: string }>;

const T = {
  brand: { ar: "رنين نيلز", he: "רנין ניילז" },
  tagline: { ar: "فن الأظافر بلمسة أنثوية", he: "אומנות הציפורניים במגע נשי" },
  location: { ar: "كفر دير الأسد", he: "כפר דיר אל אסד" },
  bookNow: { ar: "احجزي موعدك", he: "קבעי תור" },
  services: { ar: "خدماتنا", he: "השירותים שלנו" },
  about: { ar: "عن الصالون", he: "על הסלון" },
  aboutText: {
    ar: "صالون رنين هو وجهتك للعناية بالأظافر والحواجب في كفر دير الأسد. أناقة، نظافة ولمسة فنية في كل تفصيل.",
    he: "סלון רנין הוא היעד שלך לטיפוח ציפורניים וגבות בכפר דיר אל אסד. אלגנטיות, ניקיון ומגע אומנותי בכל פרט.",
  },
  contact: { ar: "تواصلي معنا", he: "צרי קשר" },
  workingHours: { ar: "ساعات العمل", he: "שעות פעילות" },
  hoursValue: {
    ar: "كل يوم 10:00 - 18:00 (الإثنين مغلق)",
    he: "כל יום 10:00 - 18:00 (יום שני סגור)",
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

export const RENIN_PHONE = "972502204606"; // 0502204606 → intl format for wa.me
