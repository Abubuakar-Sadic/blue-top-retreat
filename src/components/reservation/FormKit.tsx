import { CheckCircle2, MessageCircle } from "lucide-react";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const inputCls =
  "w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all text-sm";

export const Field = ({
  label, children, hint, required,
}: { label: string; children: React.ReactNode; hint?: string; required?: boolean }) => (
  <div>
    <label className="block text-xs text-muted-foreground mb-1">
      {label} {required && <span className="text-gold">*</span>}
    </label>
    {children}
    {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
  </div>
);

/** A compact yes/no toggle rendered as a native select for reliability on mobile. */
export const YesNo = ({
  label, value, onChange,
}: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
  <Field label={label}>
    <select className={inputCls} value={value ? "yes" : "no"} onChange={(e) => onChange(e.target.value === "yes")}>
      <option value="no">No</option>
      <option value="yes">Yes</option>
    </select>
  </Field>
);

export const CheckRow = ({
  checked, onChange, children, id,
}: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode; id: string }) => (
  <label htmlFor={id} className="flex items-start gap-3 text-sm cursor-pointer">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-gold accent-[hsl(var(--gold))] focus:outline-none focus:ring-2 focus:ring-gold/50"
    />
    <span className="text-muted-foreground leading-snug">{children}</span>
  </label>
);

/** The two mandatory confirmations required before any reservation is submitted. */
export const ConsentGate = ({
  idPrefix, accurate, terms, onAccurate, onTerms,
}: {
  idPrefix: string;
  accurate: boolean;
  terms: boolean;
  onAccurate: (v: boolean) => void;
  onTerms: (v: boolean) => void;
}) => (
  <div className="space-y-2.5 rounded-lg border border-border/70 bg-muted/30 p-3.5">
    <CheckRow id={`${idPrefix}-accurate`} checked={accurate} onChange={onAccurate}>
      I confirm that all information provided is true and accurate.
    </CheckRow>
    <CheckRow id={`${idPrefix}-terms`} checked={terms} onChange={onTerms}>
      I have read and agree to the Blue Top Villa{" "}
      <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Terms &amp; Conditions</a>{" "}
      and{" "}
      <a href="/cancellation-policy" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Cancellation Policy</a>.
    </CheckRow>
  </div>
);

/** Shared confirmation screen shown after a successful submission. */
export const ConfirmationPanel = ({
  reference, whatsappText, onDone,
}: { reference: string; whatsappText: string; onDone: () => void }) => (
  <div className="text-center py-6 space-y-4">
    <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
    <DialogHeader>
      <DialogTitle className="font-display text-2xl text-center">Reservation Submitted Successfully</DialogTitle>
      <DialogDescription className="text-center">
        Please keep this reference number. Blue Top Villa will contact you shortly to confirm your reservation.
      </DialogDescription>
    </DialogHeader>
    <div className="bg-muted rounded-lg py-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Your Reservation Reference Number</p>
      <p className="font-mono text-xl sm:text-2xl font-bold text-gold break-all px-2">{reference}</p>
    </div>
    <a
      href={`https://wa.me/233559171787?text=${encodeURIComponent(whatsappText)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] text-white py-2.5 font-medium hover:opacity-90 transition-opacity"
    >
      <MessageCircle className="w-4 h-4" /> Send via WhatsApp
    </a>
    <button onClick={onDone} className="btn-gold w-full">Done</button>
  </div>
);

export const ESTIMATE_DISCLAIMER =
  "This is only an estimated amount. Final confirmation will be provided by Blue Top Villa.";