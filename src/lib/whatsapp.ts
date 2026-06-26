// Blue Top Villa WhatsApp number (international format, no +)
export const VILLA_WHATSAPP = "233559171787";

/**
 * Build a wa.me link with a prefilled message and open it so the booking
 * details are sent directly to Blue Top Villa's WhatsApp.
 */
export const sendBookingToWhatsApp = (lines: string[]) => {
  const text = encodeURIComponent(lines.filter(Boolean).join("\n"));
  const url = `https://wa.me/${VILLA_WHATSAPP}?text=${text}`;
  window.open(url, "_blank", "noopener,noreferrer");
};