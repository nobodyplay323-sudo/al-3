import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import Marquee from "react-fast-marquee";
import {
  ArrowUpRight,
  HeartHandshake,
  CalendarHeart,
  MessagesSquare,
  Users,
  Trophy,
  LifeBuoy,
  Menu,
  Leaf,
} from "lucide-react";
import useLenis from "@/hooks/useLenis";
import { Reveal, MaskLine, FadeIn } from "@/components/motion";
import { useAuth } from "@/context/AuthContext";

const HERO_IMG =
  "https://images.unsplash.com/photo-1504548840739-580b10ae7715?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHNtb290aCUyMHdhdmVzJTIwc2FuZHxlbnwwfHx8fDE3ODUzNzExNzd8MA&ixlib=rb-4.1.0&q=85";
const FOG_IMG =
  "https://images.unsplash.com/photo-1560996025-95b43d543770?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwyfHxjYWxtJTIwcGVhY2VmdWwlMjBuYXR1cmUlMjBmb2d8ZW58MHx8fHwxNzg1MzcxMTc2fDA&ixlib=rb-4.1.0&q=85";
const SUNRISE_IMG =
  "https://images.unsplash.com/photo-1503803548695-c2a7b4a5b875?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwzfHxzdW5yaXNlJTIwaG9wZSUyMHBlYWNlZnVsfGVufDB8fHx8MTc4NTM3MTE3Nnww&ixlib=rb-4.1.0&q=85";

const CHAPTERS = [
  {
    n: "01",
    title: "Recunoaște",
    text: "Primul pas nu este slăbiciune, ci cel mai curajos act de sinceritate față de tine însuți.",
  },
  {
    n: "02",
    title: "Respiră",
    text: "Fiecare zi începe cu o singură respirație. Nu trebuie să vindeci totul azi — doar să rămâi prezent.",
  },
  {
    n: "03",
    title: "Reconstruiește",
    text: "Zi după zi, alegere după alegere, îți clădești din nou încrederea și viața pe care o meriți.",
  },
  {
    n: "04",
    title: "Renaște",
    text: "Nu ești definit de trecut. Ești ceea ce alegi să devii, chiar acum, în această clipă.",
  },
];

const FEATURES = [
  { icon: CalendarHeart, title: "Contor de sobrietate", text: "Numără zilele, banii economisiți și sănătatea recâștigată." },
  { icon: HeartHandshake, title: "Jurnal emoțional", text: "Notează-ți starea zilnic și observă cum evoluezi." },
  { icon: MessagesSquare, title: "Asistent AI 24/7", text: "Vorbește oricând cu Speranță, ghidul tău empatic." },
  { icon: Users, title: "Comunitate", text: "Nu ești singur. Împărtășește și primește sprijin." },
  { icon: Trophy, title: "Obiective & medalii", text: "Sărbătorește fiecare reușită de pe drum." },
  { icon: LifeBuoy, title: "Resurse & urgențe", text: "Linii de ajutor și ghiduri când ai cel mai mult nevoie." },
];

const Nav = () => {
  const { user } = useAuth();
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-background/70 backdrop-blur-xl border-b border-black/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" data-testid="logo-home">
          <span className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center">
            <Leaf className="h-4.5 w-4.5" strokeWidth={1.5} size={18} />
          </span>
          <span className="font-serif text-2xl tracking-tight text-foreground">Renaștere</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#manifest" className="hover:text-foreground transition-colors">Manifest</a>
          <a href="#instrumente" className="hover:text-foreground transition-colors">Instrumente</a>
          <a href="#urgente" className="hover:text-foreground transition-colors">Ajutor</a>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/app" data-testid="nav-dashboard-btn" className="rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm hover:opacity-90 transition-opacity">
              Panoul meu
            </Link>
          ) : (
            <>
              <Link to="/login" data-testid="nav-login-btn" className="hidden sm:inline text-sm text-foreground hover:text-primary transition-colors">
                Autentificare
              </Link>
              <Link to="/register" data-testid="nav-register-btn" className="rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm hover:opacity-90 transition-opacity">
                Începe acum
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

const Hero = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-[100svh] flex items-center overflow-hidden pb-16 pt-24">
      <motion.div style={{ y, scale }} className="absolute inset-0 z-0">
        <img src={HERO_IMG} alt="dune de nisip" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </motion.div>

      <motion.div style={{ opacity }} className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 w-full">
        <FadeIn delay={0.2}>
          <span className="inline-block text-xs md:text-sm uppercase tracking-[0.3em] text-primary mb-6" data-testid="hero-eyebrow">
            Libertate • Vindecare • Speranță
          </span>
        </FadeIn>

        <h1 className="font-serif font-light tracking-tight text-foreground text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
          <MaskLine delay={0.35}>Drumul tău spre</MaskLine>
          <MaskLine delay={0.5} className="italic text-primary">libertate</MaskLine>
          <MaskLine delay={0.65}>începe azi.</MaskLine>
        </h1>

        <div className="mt-10 flex flex-col md:flex-row md:items-end gap-8 md:justify-between">
          <FadeIn delay={0.9} className="max-w-md text-base md:text-lg text-muted-foreground">
            Un spațiu blând și sigur care te sprijină să te eliberezi de dependența de alcool,
            droguri și alte obiceiuri — pas cu pas, zi după zi.
          </FadeIn>
          <FadeIn delay={1.05}>
            <Link
              to="/register"
              data-testid="hero-cta-btn"
              className="group inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-4 text-base hover:pl-9 transition-all duration-300"
            >
              Pornește călătoria
              <ArrowUpRight className="h-5 w-5 group-hover:rotate-45 transition-transform duration-300" strokeWidth={1.5} />
            </Link>
          </FadeIn>
        </div>
      </motion.div>
    </section>
  );
};

const MarqueeStrip = () => (
  <div className="border-y border-black/5 bg-secondary py-6 overflow-hidden">
    <Marquee speed={40} gradient={false}>
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="font-serif italic text-3xl md:text-5xl text-primary/70 mx-8">
          Respiră <span className="text-accent-foreground/30 mx-4">•</span> Vindecă-te
          <span className="text-accent-foreground/30 mx-4">•</span> Trăiește
          <span className="text-accent-foreground/30 mx-4">•</span>
        </span>
      ))}
    </Marquee>
  </div>
);

const Manifesto = () => (
  <section id="manifest" className="max-w-7xl mx-auto px-6 lg:px-10 py-24 md:py-36">
    <Reveal className="max-w-2xl mb-20">
      <span className="text-xs uppercase tracking-[0.3em] text-primary">Manifest</span>
      <h2 className="font-serif font-light text-4xl md:text-5xl lg:text-6xl tracking-tight mt-5 text-balance">
        Patru pași care schimbă totul.
      </h2>
    </Reveal>

    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
      <div className="md:col-span-7 grid gap-8">
        {CHAPTERS.map((c, i) => (
          <Reveal key={c.n} delay={i * 0.08}>
            <div className="group flex gap-6 md:gap-10 border-t border-black/10 pt-8 hover:-translate-y-1 transition-transform duration-300">
              <span className="font-serif text-3xl md:text-4xl text-primary/40">{c.n}</span>
              <div>
                <h3 className="font-serif text-3xl md:text-4xl text-foreground mb-2">{c.title}</h3>
                <p className="text-muted-foreground text-base md:text-lg max-w-lg">{c.text}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.15} className="md:col-span-5">
        <div className="sticky top-24 overflow-hidden rounded-[2rem] h-[420px] md:h-[560px] border border-black/5">
          <img src={FOG_IMG} alt="lac în ceață" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-primary/10" />
          <div className="absolute bottom-6 left-6 right-6 bg-background/80 backdrop-blur-md rounded-2xl p-6">
            <p className="font-serif italic text-xl text-foreground">
              „Nu contează cât de încet mergi, atâta timp cât nu te oprești.”
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);

const Features = () => (
  <section id="instrumente" className="bg-secondary/60 py-24 md:py-36">
    <div className="max-w-7xl mx-auto px-6 lg:px-10">
      <Reveal className="max-w-2xl mb-16">
        <span className="text-xs uppercase tracking-[0.3em] text-primary">Instrumentele tale</span>
        <h2 className="font-serif font-light text-4xl md:text-5xl lg:text-6xl tracking-tight mt-5">
          Tot ce ai nevoie ca să reușești.
        </h2>
      </Reveal>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.06}>
            <div className="h-full bg-card rounded-3xl p-8 border border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1.5 hover:shadow-[0_18px_40px_rgb(0,0,0,0.08)] transition-all duration-300">
              <span className="h-12 w-12 rounded-2xl bg-primary/10 text-primary grid place-items-center mb-6">
                <f.icon className="h-6 w-6" strokeWidth={1.5} />
              </span>
              <h3 className="font-serif text-2xl md:text-3xl text-foreground mb-2">{f.title}</h3>
              <p className="text-muted-foreground">{f.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

const CTA = () => (
  <section id="urgente" className="relative overflow-hidden">
    <div className="absolute inset-0 z-0">
      <img src={SUNRISE_IMG} alt="răsărit" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-primary/70" />
    </div>
    <div className="relative z-10 max-w-4xl mx-auto px-6 py-28 md:py-40 text-center">
      <Reveal>
        <h2 className="font-serif font-light text-4xl md:text-6xl text-primary-foreground tracking-tight text-balance">
          Astăzi poate fi prima zi din restul vieții tale.
        </h2>
        <p className="text-primary-foreground/80 mt-6 max-w-xl mx-auto text-lg">
          Fă primul pas. Este gratuit, confidențial și făcut cu grijă pentru tine.
        </p>
        <Link
          to="/register"
          data-testid="cta-register-btn"
          className="inline-flex items-center gap-2 mt-10 rounded-full bg-background text-foreground px-8 py-4 text-base hover:scale-[1.03] transition-transform duration-300"
        >
          Creează cont gratuit
          <ArrowUpRight className="h-5 w-5" strokeWidth={1.5} />
        </Link>
      </Reveal>
    </div>
  </section>
);

const EmergencyBar = () => (
  <div className="bg-foreground text-background">
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <p className="text-sm md:text-base">
        <span className="font-serif text-xl mr-2">În criză?</span>
        Sună imediat la <strong>112</strong> sau la Telefonul Anti-Drog:{" "}
        <strong>0800 870 070</strong> (gratuit, 24/7).
      </p>
      <span className="text-xs text-background/50">© {new Date().getFullYear()} Renaștere</span>
    </div>
  </div>
);

export default function Landing() {
  useLenis(true);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="bg-background grain relative">
      <Nav />
      <Hero />
      <MarqueeStrip />
      <Manifesto />
      <Features />
      <CTA />
      <EmergencyBar />
    </div>
  );
}
