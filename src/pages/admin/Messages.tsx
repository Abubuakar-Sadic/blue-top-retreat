import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Trash2, Mail, MailOpen } from "lucide-react";
import { format } from "date-fns";

const Messages = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
    setItems(data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Message deleted"); load();
  };
  const toggleRead = async (m: any) => {
    await supabase.from("contact_messages").update({ is_read: !m.is_read }).eq("id", m.id);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Contact Messages</h1>
        <p className="text-muted-foreground text-sm mt-1">Inquiries from your website visitors.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>
      ) : items.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed p-16 text-center text-muted-foreground">No messages yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <div key={m.id} className={`bg-card rounded-xl border shadow-sm p-5 ${m.is_read ? "border-border/60" : "border-[hsl(var(--gold))]/40 bg-[hsl(var(--gold))]/5"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{m.name}</h3>
                    {!m.is_read && <span className="text-[10px] uppercase tracking-wider bg-gold text-white px-1.5 py-0.5 rounded">New</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 space-x-3">
                    {m.email && <span>{m.email}</span>}
                    {m.phone && <span>· {m.phone}</span>}
                    <span>· {format(new Date(m.created_at), "PPp")}</span>
                  </div>
                  {m.subject && <p className="font-medium text-sm mt-2">{m.subject}</p>}
                  <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{m.message}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => toggleRead(m)} className="p-2 rounded-md hover:bg-muted" title={m.is_read ? "Mark unread" : "Mark read"}>
                    {m.is_read ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
                  </button>
                  <button onClick={() => remove(m.id)} className="p-2 rounded-md hover:bg-destructive/10 text-destructive" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Messages;