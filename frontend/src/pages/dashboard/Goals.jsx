import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Trash2, Target, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Reveal } from "@/components/motion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await api.get("/goals");
    setGoals(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await api.post("/goals", { title, description: desc });
    setSaving(false);
    setTitle(""); setDesc(""); setOpen(false);
    toast.success("Obiectiv adăugat");
    load();
  };

  const toggle = async (id) => {
    await api.put(`/goals/${id}/toggle`);
    load();
  };
  const remove = async (id) => {
    await api.delete(`/goals/${id}`);
    load();
  };

  const done = goals.filter((g) => g.completed).length;

  return (
    <div className="space-y-8" data-testid="goals-page">
      <Reveal>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-[0.2em]">Progresul tău</p>
            <h1 className="font-serif font-light text-4xl md:text-5xl tracking-tight mt-2">Obiective</h1>
            <p className="text-muted-foreground mt-2">{done} din {goals.length} atinse</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button data-testid="add-goal-btn" className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 hover:opacity-90 transition-opacity">
                <Plus className="h-5 w-5" strokeWidth={1.5} /> Obiectiv nou
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">Un nou obiectiv</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <input
                  value={title} onChange={(e) => setTitle(e.target.value)}
                  data-testid="goal-title-input" placeholder="Ex: Alerg de 3 ori pe săptămână"
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                />
                <textarea
                  value={desc} onChange={(e) => setDesc(e.target.value)}
                  data-testid="goal-desc-input" placeholder="Detalii (opțional)" rows={3}
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
              <DialogFooter>
                <button onClick={add} disabled={saving} data-testid="save-goal-btn" className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 hover:opacity-90 transition-opacity disabled:opacity-60">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvează
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Reveal>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : goals.length === 0 ? (
        <Reveal>
          <div className="text-center py-20 bg-card rounded-3xl border border-black/5">
            <Target className="h-10 w-10 mx-auto text-primary/40 mb-4" strokeWidth={1.5} />
            <p className="font-serif text-2xl">Niciun obiectiv încă</p>
            <p className="text-muted-foreground mt-1">Stabilește primul tău obiectiv și pornește la drum.</p>
          </div>
        </Reveal>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {goals.map((g) => (
              <motion.div
                key={g.id} layout
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                data-testid={`goal-${g.id}`}
                className={`group rounded-3xl p-6 border transition-colors ${g.completed ? "bg-primary/5 border-primary/20" : "bg-card border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"}`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => toggle(g.id)} data-testid={`toggle-goal-${g.id}`}
                    className={`mt-1 h-6 w-6 shrink-0 rounded-full border-2 grid place-items-center transition-colors ${g.completed ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"}`}
                  >
                    {g.completed && <Check className="h-4 w-4" strokeWidth={2.5} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-serif text-xl ${g.completed ? "line-through text-muted-foreground" : ""}`}>{g.title}</p>
                    {g.description && <p className="text-sm text-muted-foreground mt-1">{g.description}</p>}
                  </div>
                  <button onClick={() => remove(g.id)} data-testid={`delete-goal-${g.id}`} className="text-muted-foreground/50 hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
