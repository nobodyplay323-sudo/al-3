import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const SIDE_IMG =
  "https://images.unsplash.com/photo-1503803548695-c2a7b4a5b875?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwzfHxzdW5yaXNlJTIwaG9wZSUyMHBlYWNlZnVsfGVufDB8fHx8MTc4NTM3MTE3Nnww&ixlib=rb-4.1.0&q=85";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) {
      toast.success("Bine ai revenit!");
      navigate("/app");
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12 relative">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-12" data-testid="back-home-link">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> Înapoi acasă
        </Link>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-md">
          <span className="h-11 w-11 rounded-full bg-primary text-primary-foreground grid place-items-center mb-8">
            <Leaf className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <h1 className="font-serif font-light text-4xl md:text-5xl tracking-tight text-foreground">Bine ai revenit</h1>
          <p className="text-muted-foreground mt-3">Continuă-ți drumul spre libertate.</p>

          <form onSubmit={submit} className="mt-10 space-y-5" data-testid="login-form">
            <div>
              <label className="text-sm text-foreground">Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                data-testid="login-email-input"
                className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3.5 outline-none focus:ring-2 focus:ring-primary transition-shadow"
                placeholder="tu@exemplu.ro"
              />
            </div>
            <div>
              <label className="text-sm text-foreground">Parolă</label>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                data-testid="login-password-input"
                className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3.5 outline-none focus:ring-2 focus:ring-primary transition-shadow"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-destructive" data-testid="login-error">{error}</p>}
            <button
              type="submit" disabled={loading} data-testid="login-submit-button"
              className="w-full rounded-2xl bg-primary text-primary-foreground py-3.5 font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Autentifică-te
            </button>
          </form>
          <p className="text-sm text-muted-foreground mt-8">
            Nu ai cont?{" "}
            <Link to="/register" className="text-primary hover:underline" data-testid="go-register-link">Creează unul</Link>
          </p>
        </motion.div>
      </div>
      <div className="hidden lg:block relative overflow-hidden">
        <img src={SIDE_IMG} alt="răsărit" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-primary/30" />
        <div className="absolute bottom-12 left-12 right-12">
          <p className="font-serif italic text-3xl text-white leading-snug">
            „Fiecare zi curată este o victorie care merită sărbătorită.”
          </p>
        </div>
      </div>
    </div>
  );
}
