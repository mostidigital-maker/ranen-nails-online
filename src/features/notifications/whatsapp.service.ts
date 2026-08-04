import { digitsOnly, formatDate, formatTime, toInternational } from "@/shared/utils/datetime";
import type { Lang } from "@/shared/types/common";

/**
 * Notifications module — currently WhatsApp deep links.
 * All customer-facing message copy lives here so future channels
 * (SMS, email, push) can reuse the same templates.
 */

export type NewBookingMessageInput = {
  lang: Lang;
  clientName: string;
  clientPhone: string;
  serviceNameAr: string;
  serviceNameHe: string;
  price: number;
  currency: string;
  date: string;
  time: string;
  notes?: string;
};

export type StatusMessageInput = {
  lang: Lang;
  businessName: string;
  clientName: string;
  serviceName: string;
  appointmentAt: string;
};

export const whatsappTemplates = {
  newBooking(i: NewBookingMessageInput): string {
    return i.lang === "ar"
      ? `حجز جديد 💅\nالاسم: ${i.clientName}\nالهاتف: ${i.clientPhone}\nالخدمة: ${i.serviceNameAr}\nالسعر: ${i.price}${i.currency}\nالتاريخ: ${i.date}\nالوقت: ${i.time}${i.notes ? `\nملاحظات: ${i.notes}` : ""}`
      : `תור חדש 💅\nשם: ${i.clientName}\nטלפון: ${i.clientPhone}\nשירות: ${i.serviceNameHe}\nמחיר: ${i.price}${i.currency}\nתאריך: ${i.date}\nשעה: ${i.time}${i.notes ? `\nהערות: ${i.notes}` : ""}`;
  },

  confirmed(i: StatusMessageInput): string {
    const dateStr = formatDate(i.appointmentAt, i.lang);
    const timeStr = formatTime(i.appointmentAt, i.lang);
    return i.lang === "ar"
      ? `مرحباً ${i.clientName} 💕\nتم تأكيد موعدك في ${i.businessName}:\nالخدمة: ${i.serviceName}\nالتاريخ: ${dateStr}\nالوقت: ${timeStr}\nبانتظارك!`
      : `שלום ${i.clientName} 💕\nהתור שלך ב${i.businessName} אושר:\nשירות: ${i.serviceName}\nתאריך: ${dateStr}\nשעה: ${timeStr}\nמחכה לך!`;
  },

  cancelled(i: StatusMessageInput): string {
    const dateStr = formatDate(i.appointmentAt, i.lang);
    const timeStr = formatTime(i.appointmentAt, i.lang);
    return i.lang === "ar"
      ? `مرحباً ${i.clientName}\nنعتذر، تم إلغاء موعدك:\nالخدمة: ${i.serviceName}\nالتاريخ: ${dateStr} ${timeStr}\nتواصلي معنا لتحديد موعد جديد.`
      : `שלום ${i.clientName}\nלצערנו התור שלך בוטל:\nשירות: ${i.serviceName}\nתאריך: ${dateStr} ${timeStr}\nצרי קשר לקביעת תור חדש.`;
  },
};

export const whatsappService = {
  /** Link to a business number already stored in international format. */
  businessLink(number: string, message?: string): string | null {
    const wa = digitsOnly(number);
    if (!wa) return null;
    return `https://wa.me/${wa}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
  },

  /** Link to a client number entered in local (05x) format. */
  clientLink(phone: string, message?: string): string {
    return `https://wa.me/${toInternational(phone)}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
  },

  open(url: string | null) {
    if (url && typeof window !== "undefined") window.open(url, "_blank");
  },
};
