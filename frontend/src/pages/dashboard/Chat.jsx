import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, Sparkles, Leaf } from "lucide-react";
import { API } from "@/lib/api";
import { Reveal } from "@/components/motion";

const SUGGESTIONS = [
  "Am o poftă puternică chiar acum.",
  "Mă simt singur astăzi.",
  "Cum îmi pot ține mintea ocupată?",
  "Am nevoie de o vorbă de încurajare.",
];

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: msg }, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: msg, session_id: sessionId }),
      });
      const sid = res.headers.get("X-Session-Id");
      if (sid && !sessionId) setSessionId(sid);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (e) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: "Îmi pare rău, a apărut o problemă de conexiune. Încearcă din nou." };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)]" data-testid="chat-page">
      <Reveal>
        <div className="flex items-center gap-3 mb-6">
          <span className="h-11 w-11 rounded-full bg-primary text-primary-foreground grid place-items-center">
            <Sparkles className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div>
            <h1 className="font-serif text-3xl tracking-tight">Speranță</h1>
            <p className="text-sm text-muted-foreground">Asistentul tău empatic • disponibil 24/7</p>
          </div>
        </div>
      </Reveal>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-5 pr-1" data-testid="chat-messages">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <span className="h-16 w-16 rounded-full bg-primary/10 text-primary grid place-items-center mb-5">
              <Leaf className="h-7 w-7" strokeWidth={1.5} />
            </span>
            <p className="font-serif text-2xl md:text-3xl max-w-md">Sunt aici pentru tine. Despre ce ai vrea să vorbim?</p>
            <div className="flex flex-wrap gap-2 justify-center mt-6 max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} data-testid="chat-suggestion"
                  className="px-4 py-2 rounded-full text-sm border border-border hover:border-primary/40 hover:bg-secondary transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <motion.div
            key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            data-testid={`msg-${m.role}`}
          >
            <div className={`max-w-[85%] md:max-w-[75%] rounded-3xl px-5 py-3.5 ${
              m.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-lg"
                : "bg-card border border-black/5 rounded-bl-lg"
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">
                {m.content || (streaming && i === messages.length - 1 ? <Loader2 className="h-4 w-4 animate-spin" /> : "")}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="pt-4">
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex items-center gap-3 bg-card rounded-full border border-border p-2 pl-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          data-testid="chat-form"
        >
          <input
            value={input} onChange={(e) => setInput(e.target.value)}
            data-testid="chat-input" placeholder="Scrie un mesaj..."
            className="flex-1 bg-transparent outline-none"
          />
          <button
            type="submit" disabled={streaming || !input.trim()} data-testid="chat-send-btn"
            className="h-11 w-11 shrink-0 rounded-full bg-primary text-primary-foreground grid place-items-center hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {streaming ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" strokeWidth={1.5} />}
          </button>
        </form>
        <p className="text-xs text-center text-muted-foreground mt-3">
          În caz de urgență sună la <strong>112</strong>. Speranță nu înlocuiește ajutorul medical.
        </p>
      </div>
    </div>
  );
}
