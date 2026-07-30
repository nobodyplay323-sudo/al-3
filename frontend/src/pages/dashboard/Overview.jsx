import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Flame,
  PiggyBank,
  HeartPulse,
  Trophy,
  ArrowUpRight,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Reveal } from "@/components/motion";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const WELCOME_IMG =
  "https://images.unsplash.com/photo-1503803548695-c2a7b4a5b875?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwzfHxzdW5yaXNlJTIwaG9wZSUyMHBlYWNlZnVsfGVufDB8fHx8MTc4NTM3MTE3Nnww&ixlib=rb-4.1.0&q=85";

export default function Overview() {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [badges, setBadges] = useState([]);

  const load = async () => {
    const [s, b] = await Promise.all([api.get("/tracker/stats"), api.get("/badges")]);
    setStats(s.data);
    setBadges(b.data.badges);
  };
  useEffect(() => { load(); }, []);

  const reset = async () => {
    await api.post("/tracker/reset");
    toast.success("Contorul a fost resetat. Fiecare nou început contează.");
    await Promise.all([load(), refreshUser()]);
  };

  const earned = badges.filter((b) => b.earned);
  const progressPct = stats?.next_milestone
    ? Math.min(100, Math.round((stats.days_sober / stats.next_milestone) * 100))
    : 100;

  return (
    <div className="space-y-8" data-testid="overview-page">
      <Reveal>
        <p className="text-sm text-muted-foreground uppercase tracking-[0.2em]">Panoul tău</p>
        <h1 className="font-serif font-light text-4xl md:text-5xl tracking-tight mt-2">
          Salut, {user?.name?.split(" ")[0]}.
        </h1>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sobriety tracker - dominant */}
        <Reveal className="md:col-span-2">
          <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-8 md:p-10 h-full min-h-[280px] flex flex-col justify-between" data-testid="sobriety-widget">
            <img src={WELCOME_IMG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
            <div className="relative z-10 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-primary-foreground/80">
                <Flame className="h-4 w-4" strokeWidth={1.5} /> Zile de libertate
              </span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button data-testid="reset-tracker-btn" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                    <RotateCcw className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Resetezi contorul?</AlertDialogTitle>
                    <AlertDialogDescription>
                      O recădere nu îți șterge progresul interior. Contorul va porni din nou de la ziua de azi.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="reset-cancel">Anulează</AlertDialogCancel>
                    <AlertDialogAction onClick={reset} data-testid="reset-confirm">Resetează</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <div className="relative z-10">
              <motion.p
                key={stats?.days_sober}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="font-serif font-light text-[6rem] md:text-[8rem] leading-none"
                data-testid="days-sober-count"
              >
                {stats?.days_sober ?? "—"}
              </motion.p>
              <p className="text-primary-foreground/80 mt-2">
                {stats?.next_milestone
                  ? `Încă ${stats.next_milestone - stats.days_sober} zile până la ${stats.next_milestone} zile`
                  : "Ai atins toate reperele majore!"}
              </p>
              <div className="mt-4 h-2 rounded-full bg-primary-foreground/20 overflow-hidden">
                <motion.div
                  className="h-full bg-primary-foreground"
                  initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          </div>
        </Reveal>

        {/* Side stats */}
        <div className="grid grid-cols-1 gap-6">
          <Reveal delay={0.05}>
            <StatCard icon={PiggyBank} label="Bani economisiți" value={`${stats?.money_saved ?? 0} lei`} testid="money-saved" />
          </Reveal>
          <Reveal delay={0.1}>
            <StatCard icon={HeartPulse} label="Repere atinse" value={`${stats?.reached_milestones?.length ?? 0}`} testid="milestones-reached" />
          </Reveal>
        </div>
      </div>

      {/* Badges */}
      <Reveal>
        <div className="bg-card rounded-3xl p-8 border border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" data-testid="badges-widget">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl md:text-3xl flex items-center gap-3">
              <Trophy className="h-6 w-6 text-primary" strokeWidth={1.5} /> Medaliile tale
            </h2>
            <span className="text-sm text-muted-foreground">{earned.length} / {badges.length}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {badges.map((b) => (
              <div
                key={b.key}
                data-testid={`badge-${b.key}`}
                className={`rounded-2xl p-5 border text-center transition-all ${
                  b.earned ? "bg-primary/5 border-primary/20" : "bg-secondary/50 border-black/5 opacity-50"
                }`}
              >
                <Trophy className={`h-7 w-7 mx-auto mb-3 ${b.earned ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.5} />
                <p className="font-serif text-lg leading-tight">{b.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal>
        <Link to="/app/asistent" data-testid="overview-chat-cta" className="group flex items-center justify-between bg-accent rounded-3xl p-8 hover:-translate-y-1 transition-transform duration-300">
          <div>
            <h3 className="font-serif text-2xl md:text-3xl">Ai nevoie să vorbești cu cineva?</h3>
            <p className="text-muted-foreground mt-1">Speranță, asistentul tău, este disponibil non-stop.</p>
          </div>
          <ArrowUpRight className="h-8 w-8 text-primary group-hover:rotate-45 transition-transform duration-300" strokeWidth={1.5} />
        </Link>
      </Reveal>
    </div>
  );
}

const StatCard = ({ icon: Icon, label, value, testid }) => (
  <div className="bg-card rounded-3xl p-6 border border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full flex flex-col justify-between" data-testid={testid}>
    <span className="h-11 w-11 rounded-2xl bg-primary/10 text-primary grid place-items-center">
      <Icon className="h-5 w-5" strokeWidth={1.5} />
    </span>
    <div className="mt-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-serif text-3xl mt-1">{value}</p>
    </div>
  </div>
);
