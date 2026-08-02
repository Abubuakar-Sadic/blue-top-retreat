import { Check, X, Ban, Pencil, Printer, FileDown, MessageCircle, Mail, Phone } from "lucide-react";
import type { ReservationView } from "@/lib/reservations";
import { callCustomer, exportReservationPdf, printReservation, sendEmail, sendWhatsApp } from "@/lib/reservationActions";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  view: ReservationView;
  onStatus: (status: string) => void;
  onEdit?: () => void;
  /** Extra label/value pairs added to printed & exported documents. */
  extra?: [string, string][];
};

const btn =
  "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs hover:bg-muted transition-colors disabled:opacity-50";

const QuickActions = ({ view, onStatus, onEdit, extra = [] }: Props) => {
  const { can } = useAuth();
  const canManage = can("manage_bookings");
  return (
    <div className="flex flex-wrap gap-2">
      {canManage && (
        <>
          <button onClick={() => onStatus("confirmed")} className={`${btn} text-emerald-700 border-emerald-500/40 hover:bg-emerald-500/10`}>
            <Check className="w-3.5 h-3.5" /> Confirm
          </button>
          <button onClick={() => onStatus("rejected")} className={`${btn} text-rose-700 border-rose-500/40 hover:bg-rose-500/10`}>
            <X className="w-3.5 h-3.5" /> Reject
          </button>
          <button onClick={() => onStatus("cancelled")} className={`${btn} text-amber-700 border-amber-500/40 hover:bg-amber-500/10`}>
            <Ban className="w-3.5 h-3.5" /> Cancel
          </button>
          {onEdit && (
            <button onClick={onEdit} className={btn}><Pencil className="w-3.5 h-3.5" /> Edit</button>
          )}
        </>
      )}
      <button onClick={() => printReservation(view, extra)} className={btn}><Printer className="w-3.5 h-3.5" /> Print</button>
      <button onClick={() => exportReservationPdf(view, extra)} className={btn}><FileDown className="w-3.5 h-3.5" /> Export PDF</button>
      <button onClick={() => sendWhatsApp(view)} className={btn}><MessageCircle className="w-3.5 h-3.5" /> WhatsApp</button>
      <button onClick={() => sendEmail(view)} className={btn}><Mail className="w-3.5 h-3.5" /> Email</button>
      <button onClick={() => callCustomer(view)} className={btn}><Phone className="w-3.5 h-3.5" /> Call</button>
    </div>
  );
};

export default QuickActions;