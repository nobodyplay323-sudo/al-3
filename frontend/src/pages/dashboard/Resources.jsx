import { Phone, Globe, BookOpen, AlertTriangle, HeartHandshake, Wind } from "lucide-react";
import { Reveal } from "@/components/motion";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

const HELPLINES = [
  { name: "Urgențe (SNUAU)", phone: "112", desc: "Pentru orice situație care îți pune viața în pericol.", urgent: true },
  { name: "Telefonul Anti-Drog", phone: "0800 870 070", desc: "Linie gratuită, confidențială, non-stop (ANA)." },
  { name: "Alcoolicii Anonimi România", phone: "0757 464 464", desc: "Sprijin de la persoane care au trecut prin aceleași lupte." },
  { name: "Asociația ALIAT (alcool)", phone: "021 9760", desc: "Consiliere și tratament pentru dependența de alcool." },
];

const TECHNIQUES = [
  { icon: Wind, title: "Respirația 4-7-8", text: "Inspiră 4 secunde, ține 7 secunde, expiră 8 secunde. Repetă de 4 ori pentru a calma sistemul nervos." },
  { icon: HeartHandshake, title: "Regula celor 5 minute", text: "Când apare pofta, promite-ți să aștepți doar 5 minute. Pofta este ca un val — crește, apoi trece." },
  { icon: BookOpen, title: "Tehnica HALT", text: "Întreabă-te: sunt Hungry (flămând), Angry (furios), Lonely (singur) sau Tired (obosit)? Adesea pofta ascunde o altă nevoie." },
];

const FAQ = [
  { q: "Ce fac când am o poftă intensă?", a: "Amână decizia cu 10 minute, sună un prieten sau folosește asistentul Speranță. Poftele ating un vârf și apoi scad — nu durează la nesfârșit." },
  { q: "Am avut o recădere. Am pierdut totul?", a: "Absolut nu. Recăderea face parte din procesul de vindecare pentru mulți oameni. Contează ce faci în continuare. Resetează contorul și continuă — fiecare zi curată contează." },
  { q: "Cum îmi susțin un apropiat dependent?", a: "Ascultă fără să judeci, evită reproșurile, încurajează pașii mici și îndeamnă-l spre ajutor specializat. Ai grijă și de tine în acest proces." },
  { q: "Datele mele sunt private?", a: "Jurnalul și progresul tău sunt personale. În comunitate poți alege oricând să postezi anonim." },
];

export default function Resources() {
  return (
    <div className="space-y-10" data-testid="resources-page">
      <Reveal>
        <p className="text-sm text-muted-foreground uppercase tracking-[0.2em]">Ești sprijinit</p>
        <h1 className="font-serif font-light text-4xl md:text-5xl tracking-tight mt-2">Resurse & Ajutor</h1>
      </Reveal>

      <Reveal>
        <div className="bg-destructive/10 border border-destructive/20 rounded-3xl p-6 flex gap-4" data-testid="emergency-banner">
          <AlertTriangle className="h-6 w-6 text-destructive shrink-0" strokeWidth={1.5} />
          <div>
            <p className="font-serif text-xl text-foreground">În criză? Cere ajutor acum.</p>
            <p className="text-muted-foreground text-sm mt-1">
              Dacă ai gânduri de a-ți face rău sau treci printr-un sevraj sever, sună imediat la <strong>112</strong>.
            </p>
          </div>
        </div>
      </Reveal>

      <section>
        <h2 className="font-serif text-2xl md:text-3xl mb-5">Linii de ajutor</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {HELPLINES.map((h, i) => (
            <Reveal key={h.name} delay={i * 0.05}>
              <a href={`tel:${h.phone.replace(/\s/g, "")}`} data-testid={`helpline-${i}`}
                className={`group flex items-start gap-4 rounded-3xl p-6 border transition-all hover:-translate-y-1 ${h.urgent ? "bg-primary text-primary-foreground border-primary" : "bg-card border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"}`}>
                <span className={`h-11 w-11 rounded-2xl grid place-items-center ${h.urgent ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"}`}>
                  <Phone className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <div>
                  <p className="font-medium">{h.name}</p>
                  <p className={`font-serif text-2xl ${h.urgent ? "" : "text-primary"}`}>{h.phone}</p>
                  <p className={`text-sm mt-1 ${h.urgent ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{h.desc}</p>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-2xl md:text-3xl mb-5">Tehnici pentru momente grele</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TECHNIQUES.map((t, i) => (
            <Reveal key={t.title} delay={i * 0.05}>
              <div className="h-full bg-card rounded-3xl p-6 border border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <span className="h-11 w-11 rounded-2xl bg-accent text-accent-foreground grid place-items-center mb-4">
                  <t.icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <p className="font-serif text-xl">{t.title}</p>
                <p className="text-sm text-muted-foreground mt-2">{t.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-2xl md:text-3xl mb-5">Întrebări frecvente</h2>
        <Reveal>
          <div className="bg-card rounded-3xl px-6 border border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <Accordion type="single" collapsible className="w-full" data-testid="faq-accordion">
              {FAQ.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left font-serif text-lg hover:no-underline">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
