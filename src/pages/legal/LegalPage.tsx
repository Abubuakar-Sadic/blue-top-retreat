import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

type Props = {
  title: string;
  description: string;
  updated?: string;
  children: React.ReactNode;
};

const LegalPage = ({ title, description, updated = "1 August 2026", children }: Props) => {
  useEffect(() => {
    document.title = `${title} | Blue Top Villa`;
    const meta = document.querySelector('meta[name="description"]');
    const previous = meta?.getAttribute("content") ?? null;
    meta?.setAttribute("content", description);
    return () => { if (previous) meta?.setAttribute("content", previous); };
  }, [title, description]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-navy-dark text-white py-14">
        <div className="section-container px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-gold transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Blue Top Villa
          </Link>
          <p className="text-gold font-medium tracking-[0.2em] uppercase text-xs mb-3">Legal</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">{title}</h1>
          <p className="text-white/60 text-sm mt-3">Last updated: {updated}</p>
        </div>
      </header>

      <main className="section-container px-4 py-12">
        <article className="max-w-3xl space-y-8 text-muted-foreground leading-relaxed text-[15px]">
          {children}
        </article>
      </main>
    </div>
  );
};

export const Clause = ({ heading, children }: { heading: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h2 className="font-display text-xl font-semibold text-foreground">{heading}</h2>
    <div className="space-y-2">{children}</div>
  </section>
);

export default LegalPage;