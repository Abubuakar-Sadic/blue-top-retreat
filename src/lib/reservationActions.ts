import jsPDF from "jspdf";
import { toast } from "sonner";
import type { ReservationView } from "@/lib/reservations";
import { ENTITY_LABELS, fmt } from "@/lib/reservations";

const detailLines = (v: ReservationView, extra: [string, string][] = []): [string, string][] => [
  ["Reference", v.reference],
  ["Type", ENTITY_LABELS[v.entityType]],
  ["Customer", v.customerName],
  ["Phone", v.phone || "—"],
  ["Email", v.email || "—"],
  ["Details", v.summary],
  ["Date", v.dateLabel],
  ["Status", String(v.status ?? "").replace(/_/g, " ")],
  ...(v.amount != null ? ([["Amount", `GHS ${Number(v.amount).toLocaleString()}`]] as [string, string][]) : []),
  ...(v.paymentStatus ? ([["Payment", v.paymentStatus]] as [string, string][]) : []),
  ["Submitted", fmt(v.createdAt, "PPp")],
  ...extra,
];

export const exportReservationPdf = (v: ReservationView, extra: [string, string][] = []) => {
  try {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Blue Top Villa", 48, 60);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Hotel & Events — Kasoa, Ghana", 48, 78);
    doc.setDrawColor(200);
    doc.line(48, 92, 547, 92);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(ENTITY_LABELS[v.entityType], 48, 118);

    let y = 148;
    detailLines(v, extra).forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(String(label).toUpperCase(), 48, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const wrapped = doc.splitTextToSize(String(value ?? "—"), 330);
      doc.text(wrapped, 200, y);
      y += 18 * wrapped.length + 6;
    });

    doc.setFontSize(9);
    doc.setTextColor(130);
    doc.text("Generated from the Blue Top Villa management dashboard", 48, 800);
    doc.save(`${v.reference || "reservation"}.pdf`);
    toast.success("PDF downloaded");
  } catch (e: any) {
    toast.error(e?.message ?? "Could not create the PDF");
  }
};

export const printReservation = (v: ReservationView, extra: [string, string][] = []) => {
  const rows = detailLines(v, extra)
    .map(
      ([label, value]) =>
        `<tr><th>${label}</th><td>${String(value ?? "—").replace(/</g, "&lt;")}</td></tr>`,
    )
    .join("");
  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) return toast.error("Enable pop-ups to print this reservation");
  win.document.write(`<!doctype html><html><head><title>${v.reference}</title>
    <style>
      body{font-family:Georgia,serif;padding:40px;color:#0f172a}
      h1{margin:0;font-size:24px}
      p.sub{margin:4px 0 24px;color:#6b7280;font-family:Arial,sans-serif}
      h2{font-size:16px;border-bottom:1px solid #d1d5db;padding-bottom:8px}
      table{width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px}
      th{text-align:left;width:180px;text-transform:uppercase;font-size:11px;color:#6b7280;padding:8px 0;vertical-align:top}
      td{padding:8px 0;border-bottom:1px solid #f1f5f9}
    </style></head><body>
    <h1>Blue Top Villa</h1><p class="sub">Hotel &amp; Events — Kasoa, Ghana</p>
    <h2>${ENTITY_LABELS[v.entityType]}</h2>
    <table>${rows}</table>
    <script>window.onload=function(){window.print()}<\/script>
  </body></html>`);
  win.document.close();
};

const digits = (phone: string) => {
  const raw = (phone || "").replace(/[^\d]/g, "");
  if (!raw) return "";
  if (raw.startsWith("233")) return raw;
  if (raw.startsWith("0")) return `233${raw.slice(1)}`;
  return raw;
};

export const messageForReservation = (v: ReservationView) =>
  [
    `Hello ${v.customerName}, this is Blue Top Villa.`,
    `Reference: ${v.reference}`,
    `${ENTITY_LABELS[v.entityType]} — ${v.summary}`,
    `Date: ${v.dateLabel}`,
    `Current status: ${String(v.status ?? "").replace(/_/g, " ")}`,
    "",
    "Please let us know if you have any questions. Thank you!",
  ].join("\n");

export const sendWhatsApp = (v: ReservationView) => {
  const to = digits(v.phone);
  if (!to) return toast.error("No phone number on this reservation");
  window.open(`https://wa.me/${to}?text=${encodeURIComponent(messageForReservation(v))}`, "_blank", "noopener,noreferrer");
};

export const sendEmail = (v: ReservationView) => {
  if (!v.email) return toast.error("No email address on this reservation");
  const subject = `Blue Top Villa — ${v.reference}`;
  window.location.href = `mailto:${v.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageForReservation(v))}`;
};

export const callCustomer = (v: ReservationView) => {
  if (!v.phone) return toast.error("No phone number on this reservation");
  window.location.href = `tel:${v.phone.replace(/\s/g, "")}`;
};