import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Send, Trash2, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Reveal } from "@/components/motion";
import { Switch } from "@/components/ui/switch";

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [anon, setAnon] = useState(false);
  const [posting, setPosting] = useState(false);
  const [commentText, setCommentText] = useState({});

  const load = async () => {
    const { data } = await api.get("/community/posts");
    setPosts(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const publish = async () => {
    if (!content.trim()) return;
    setPosting(true);
    await api.post("/community/posts", { content, anonymous: anon });
    setPosting(false);
    setContent("");
    toast.success("Postare publicată");
    load();
  };

  const like = async (id) => {
    const { data } = await api.put(`/community/posts/${id}/like`);
    setPosts((p) => p.map((x) => (x.id === id ? { ...x, like_count: data.like_count, liked_by_me: data.liked_by_me } : x)));
  };

  const comment = async (id) => {
    const text = (commentText[id] || "").trim();
    if (!text) return;
    await api.post(`/community/posts/${id}/comments`, { content: text });
    setCommentText((c) => ({ ...c, [id]: "" }));
    load();
  };

  const removePost = async (id) => {
    await api.delete(`/community/posts/${id}`);
    load();
  };

  return (
    <div className="space-y-8" data-testid="community-page">
      <Reveal>
        <p className="text-sm text-muted-foreground uppercase tracking-[0.2em]">Nu ești singur</p>
        <h1 className="font-serif font-light text-4xl md:text-5xl tracking-tight mt-2">Comunitate</h1>
        <p className="text-muted-foreground mt-2">Un spațiu sigur pentru a împărtăși și a primi sprijin.</p>
      </Reveal>

      <Reveal>
        <div className="bg-card rounded-3xl p-6 border border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" data-testid="post-form">
          <textarea
            value={content} onChange={(e) => setContent(e.target.value)} rows={3}
            data-testid="post-input" placeholder="Împărtășește un gând, o reușită sau cere sprijin..."
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch checked={anon} onCheckedChange={setAnon} data-testid="anon-switch" />
              Postează anonim
            </label>
            <button onClick={publish} disabled={posting} data-testid="publish-post-btn"
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-60">
              {posting && <Loader2 className="h-4 w-4 animate-spin" />} Publică
            </button>
          </div>
        </div>
      </Reveal>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-3xl border border-black/5">
          <Users className="h-10 w-10 mx-auto text-primary/40 mb-3" strokeWidth={1.5} />
          <p className="text-muted-foreground">Fii primul care începe o conversație.</p>
        </div>
      ) : (
        <div className="space-y-5" data-testid="posts-list">
          <AnimatePresence>
            {posts.map((p) => (
              <motion.div
                key={p.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                data-testid={`post-${p.id}`}
                className="bg-card rounded-3xl p-6 border border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-10 w-10 rounded-full bg-primary/15 text-primary grid place-items-center font-medium">
                      {(p.author_name || "A")[0].toUpperCase()}
                    </span>
                    <div>
                      <p className="font-medium">{p.author_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                  {p.is_mine && (
                    <button onClick={() => removePost(p.id)} data-testid={`delete-post-${p.id}`} className="text-muted-foreground/40 hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  )}
                </div>

                <p className="mt-4 text-foreground/90 whitespace-pre-wrap">{p.content}</p>

                <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                  <button onClick={() => like(p.id)} data-testid={`like-post-${p.id}`} className={`flex items-center gap-2 transition-colors ${p.liked_by_me ? "text-primary" : "hover:text-primary"}`}>
                    <Heart className={`h-4.5 w-4.5 ${p.liked_by_me ? "fill-primary" : ""}`} size={18} strokeWidth={1.5} /> {p.like_count}
                  </button>
                  <span className="flex items-center gap-2">
                    <MessageCircle className="h-4.5 w-4.5" size={18} strokeWidth={1.5} /> {p.comments?.length || 0}
                  </span>
                </div>

                {p.comments?.length > 0 && (
                  <div className="mt-4 space-y-3 border-t border-black/5 pt-4">
                    {p.comments.map((c) => (
                      <div key={c.id} className="flex gap-3" data-testid={`comment-${c.id}`}>
                        <span className="h-7 w-7 shrink-0 rounded-full bg-secondary text-secondary-foreground grid place-items-center text-xs">
                          {(c.author_name || "A")[0].toUpperCase()}
                        </span>
                        <div className="bg-secondary rounded-2xl px-4 py-2 flex-1">
                          <p className="text-xs font-medium">{c.author_name}</p>
                          <p className="text-sm text-foreground/90">{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-4">
                  <input
                    value={commentText[p.id] || ""} onChange={(e) => setCommentText((s) => ({ ...s, [p.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && comment(p.id)}
                    data-testid={`comment-input-${p.id}`} placeholder="Scrie un comentariu de sprijin..."
                    className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button onClick={() => comment(p.id)} data-testid={`comment-btn-${p.id}`} className="h-9 w-9 shrink-0 rounded-full bg-primary text-primary-foreground grid place-items-center hover:opacity-90 transition-opacity">
                    <Send className="h-4 w-4" strokeWidth={1.5} />
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
