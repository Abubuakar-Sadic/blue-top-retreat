import { Search } from "lucide-react";
import { RESERVATION_STATUSES } from "@/lib/reservations";

export type FilterState = {
  search: string;
  status: string;
  from: string;
  to: string;
  /** room / event / venue depending on the page */
  subject: string;
  type?: string;
};

export const emptyFilters: FilterState = { search: "", status: "all", from: "", to: "", subject: "all", type: "all" };

type Props = {
  value: FilterState;
  onChange: (next: FilterState) => void;
  /** Label + options for the page-specific dimension (Room / Venue / Event). */
  subjectLabel?: string;
  subjectOptions?: string[];
  typeLabel?: string;
  typeOptions?: string[];
  statuses?: string[];
};

const selectClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-gold/40";

const ReservationFilters = ({
  value, onChange, subjectLabel, subjectOptions = [], typeLabel, typeOptions = [], statuses = RESERVATION_STATUSES,
}: Props) => {
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch });
  return (
    <div className="bg-card rounded-xl border border-border/60 shadow-sm p-4 space-y-3">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={value.search}
          onChange={(e) => set({ search: e.target.value })}
          placeholder="Search by reference, name, phone or email"
          aria-label="Search reservations"
          className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
        />
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <select value={value.status} onChange={(e) => set({ status: e.target.value })} aria-label="Filter by status" className={selectClass}>
          <option value="all">All statuses</option>
          {statuses.map((s) => <option key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</option>)}
        </select>
        {typeLabel && (
          <select value={value.type ?? "all"} onChange={(e) => set({ type: e.target.value })} aria-label={`Filter by ${typeLabel}`} className={selectClass}>
            <option value="all">All {typeLabel}</option>
            {typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        {subjectLabel && (
          <select value={value.subject} onChange={(e) => set({ subject: e.target.value })} aria-label={`Filter by ${subjectLabel}`} className={selectClass}>
            <option value="all">All {subjectLabel}</option>
            {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <label className="flex items-center gap-1 text-xs text-muted-foreground">
          From
          <input type="date" value={value.from} onChange={(e) => set({ from: e.target.value })} aria-label="From date" className={selectClass} />
        </label>
        <label className="flex items-center gap-1 text-xs text-muted-foreground">
          To
          <input type="date" value={value.to} onChange={(e) => set({ to: e.target.value })} aria-label="To date" className={selectClass} />
        </label>
        <button onClick={() => onChange({ ...emptyFilters })} className="px-3 py-2 rounded-lg border border-border text-xs hover:bg-muted">
          Reset
        </button>
      </div>
    </div>
  );
};

export default ReservationFilters;