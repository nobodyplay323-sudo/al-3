import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Reveal } from "@/components/motion";

const TYPES = ["Alcool", "Droguri", "Nicotină", "Jocuri de noroc", "Zahăr", "Ecrane", "Altele"];

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [cost, setCost] = useState(0);
  const [types, setTypes] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setStart((user.sobriety_start || "").slice(0, 10));
      setCost(user.daily_cost || 0);
      setTypes(user.addiction_types || []);
    }
  }, [user]);

  const toggleType = (t) =>
    setTypes((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));

  const save = async () => {
    setSaving(true);
    await api.put("/auth/profile", {
      name,
      sobriety_start: start,
      daily_cost: Number(cost) || 0,
      addiction_types: types,
    });
    await refreshUser();
    setSaving(false);
    toast.success("Profil actualizat");
  };

  return (
    <div className="space-y-8 max-w-2xl" data-testid="profile-page">
      <Reveal>
        <p className="text-sm text-muted-foreground uppercase tracking-[0.2em]">Contul tău</p>
        <h1 className="font-serif font-light text-4xl md:text-5xl tracking-tight mt-2">Profil</h1>
      </Reveal>

      <Reveal>
        <div className="bg-card rounded-3xl p-6 md:p-8 border border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
          <div>
            <label className="text-sm text-foreground">Nume</label>
            <input value={name} onChange={(e) => setName(e.target.value)} data-testid="profile-name-input"
              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div>
            <label className="text-sm text-foreground">Data de început a sobrietății</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} data-testid="profile-start-input"
              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary" />
            <p className="text-xs text-muted-foreground mt-1">Din această zi calculăm progresul tău.</p>
          </div>

          <div>
            <label className="text-sm text-foreground">Cost zilnic estimat al obiceiului (lei)</label>
            <input type="number" min={0} value={cost} onChange={(e) => setCost(e.target.value)} data-testid="profile-cost-input"
              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary" />
            <p className="text-xs text-muted-foreground mt-1">Folosit pentru a calcula banii economisiți.</p>
          </div>

          <div>
            <label className="text-sm text-foreground">De ce dependențe vrei să te eliberezi?</label>
            <div className="flex flex-wrap gap-2 mt-3">
              {TYPES.map((t) => (
                <button key={t} onClick={() => toggleType(t)} data-testid={`type-${t}`}
                  className={`px-4 py-2 rounded-full text-sm border transition-colors ${types.includes(t) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button onClick={save} disabled={saving} data-testid="save-profile-btn"
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 hover:opacity-90 transition-opacity disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" strokeWidth={1.5} />}
            Salvează modificările
          </button>
        </div>
      </Reveal>
    </div>
  );
}
