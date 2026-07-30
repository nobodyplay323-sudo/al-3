import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Trash2, NotebookPen, Check } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Reveal } from "@/components/motion";

const MOODS = [
  { v: 1, label: "Foarte greu", color: "bg-[hsl(15_45%_60%)]" },
  { v: 2, label: "Greu", color: "bg-[hsl(33_55%_62%)]" },
  { v: 3, label: "Neutru", color: "bg-[hsl(43_45%_60%)]" },
  { v: 4, label: "Bine", color: "bg-[hsl(120_25%_55%)]" },
  { v: 5, label: "Excelent", color: "bg-[hsl(137_30%_45%)]" },
];

const EMOTIONS = ["Recunoscător", "Anxios", "Puternic", "Singur", "Sperant", "Furios", "Calm", "Tentat", "Mândru", "Obosit"];

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState(3);
  const [selected, setSelected] = useState([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await api.get("/journal");
    setEntries(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggleEmotion = (e) =>
    setSelected((s) => (s.includes(e) ? s.filter((x) => x !== e) : [...s, e]));

  const save = async () => {
    setSaving(true);
    await api.post("/journal", { mood, emotions: selected, note });
    setSaving(false);
    setNote(""); setSelected([]); setMood(3);
    toast.success("Intrare salvată pentru azi");
    load();
  };

  const remove = async (id) => {
    await api.delete(`/journal/${id}`);
    load();
  };

  return (
    <div className="space-y-8" data-testid="journal-page">
      <Reveal>
        <p className="text-sm text-muted-foreground uppercase tracking-[0.2em]">Cum te simți</p>
        <h1 className="font-serif font-light text-4xl md:text-5xl tracking-tight mt-2">Jurnal emoțional</h1>
      </Reveal>

      <Reveal>
        <div className="bg-card rounded-3xl p-6 md:p-8 border border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" data-testid="journal-form">
          <p className="font-serif text-2xl mb-5">Starea de azi</p>
          <div className="flex gap-3 flex-wrap mb-8">
            {MOODS.map((m) => (
              <button
                key={m.v} onClick={() => setMood(m.v)} data-testid={`mood-${m.v}`}
                className={`flex flex-col items-center gap-2 transition-transform ${mood === m.v ? "scale-110" : "opacity-60 hover:opacity-100"}`}
              >
                <span className={`h-12 w-12 rounded-full ${m.color} ${mood === m.v ? "ring-2 ring-offset-2 ring-primary" : ""}`} />
                <span className="text-xs text-muted-foreground">{m.label}</span>
              </button>
            ))}
          </div>

          <p className="text-sm text-foreground mb-3">Ce emoții trăiești?</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {EMOTIONS.map((e) => (
              <button
                key={e} onClick={() => toggleEmotion(e)} data-testid={`emotion-${e}`}
                className={`px-4 py-2 rounded-full text-sm border transition-colors ${selected.includes(e) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
              >
                {e}
              </button>
            ))}
          </div>

          <textarea
            value={note} onChange={(e) => setNote(e.target.value)} rows={4}
            data-testid="journal-note-input" placeholder="Scrie ce ai pe suflet astăzi..."
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <button
            onClick={save} disabled={saving} data-testid="save-journal-btn"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvează intrarea
          </button>
        </div>
      </Reveal>

      <div>
        <h2 className="font-serif text-2xl mb-4">Intrări anterioare</h2>
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-3xl border border-black/5">
            <NotebookPen className="h-10 w-10 mx-auto text-primary/40 mb-3" strokeWidth={1.5} />
            <p className="text-muted-foreground">Nicio intrare încă. Începe azi.</p>
          </div>
        ) : (
          <div className="space-y-4" data-testid="journal-entries">
            <AnimatePresence>
              {entries.map((e) => {
                const m = MOODS.find((x) => x.v === e.mood);
                return (
                  <motion.div
                    key={e.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    data-testid={`entry-${e.id}`}
                    className="group bg-card rounded-3xl p-6 border border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex gap-5"
                  >
                    <span className={`h-10 w-10 shrink-0 rounded-full ${m?.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {new Date(e.entry_date).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                        <button onClick={() => remove(e.id)} data-testid={`delete-entry-${e.id}`} className="text-muted-foreground/40 hover:text-destructive transition-colors">
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                      </div>
                      {e.emotions?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {e.emotions.map((em) => (
                            <span key={em} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">{em}</span>
                          ))}
                        </div>
                      )}
                      {e.note && <p className="mt-3 text-foreground/90">{e.note}</p>}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
