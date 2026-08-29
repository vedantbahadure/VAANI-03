import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trash2, MessageCircle, Bookmark, Clock } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "../lib/contexts";
import { t } from "../lib/i18n";
import { listConversations, deleteConversation, searchConversations, listBookmarks, deleteBookmark } from "../lib/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";

export default function History() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [convs, setConvs] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);

  const refresh = () => {
    listConversations().then(setConvs).catch(() => {});
    listBookmarks().then(setBookmarks).catch(() => {});
  };
  useEffect(() => { refresh(); }, []);

  const doSearch = useCallback(async (val) => {
    const query = (val ?? q).trim();
    if (!query) { setResults(null); return; }
    setResults(await searchConversations(query));
  }, [q]);

  useEffect(() => {
    const query = q.trim();
    if (!query) { setResults(null); return; }
    const timer = setTimeout(() => { searchConversations(query).then(setResults).catch(() => {}); }, 350);
    return () => clearTimeout(timer);
  }, [q]);

  const remove = async (id) => { await deleteConversation(id); toast.success(t(lang, "delete")); refresh(); };
  const removeBm = async (id) => { await deleteBookmark(id); refresh(); };

  const fmt = (iso) => { try { return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };

  return (
    <div className="px-5 md:px-10 py-8 max-w-4xl mx-auto">
      <h1 className="font-head text-3xl md:text-4xl font-light tracking-tight">{t(lang, "history_title")}</h1>
      <p className="text-muted-foreground mt-2">{t(lang, "history_sub")}</p>

      <Tabs defaultValue="conversations" className="mt-6">
        <TabsList className="rounded-full bg-muted p-1">
          <TabsTrigger value="conversations" className="rounded-full" data-testid="tab-conversations">{t(lang, "nav_history")}</TabsTrigger>
          <TabsTrigger value="bookmarks" className="rounded-full" data-testid="tab-bookmarks">{t(lang, "bookmarks")}</TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="mt-5">
          <form onSubmit={(e) => { e.preventDefault(); doSearch(); }} className="flex items-center gap-2 p-2 rounded-full border border-border bg-card/60 mb-5">
            <Search className="w-4 h-4 ml-3 text-muted-foreground" />
            <input value={q} onChange={(e) => { setQ(e.target.value); if (!e.target.value) setResults(null); }}
              placeholder={t(lang, "search_conv")} data-testid="history-search"
              className="flex-1 bg-transparent outline-none py-1.5 text-sm" />
            <button type="submit" data-testid="history-search-btn" className="rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-sm">{t(lang, "search")}</button>
          </form>

          {results ? (
            <div className="space-y-2">
              {results.length === 0 && <p className="text-sm text-muted-foreground">No results.</p>}
              {results.map((r) => (
                <button key={r.id} onClick={() => navigate(`/app/chat/${r.conversation_id}`)}
                  className="w-full text-left p-4 rounded-2xl border border-border bg-card/40 hover:bg-accent transition-colors duration-300" data-testid="search-result">
                  <div className="text-xs text-muted-foreground mb-1">{r.title} · {r.role}</div>
                  <div className="text-sm line-clamp-2">{r.content}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {convs.length === 0 && (
                <div className="text-center py-14 text-muted-foreground"><Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />{t(lang, "no_recent")}</div>
              )}
              <AnimatePresence>
                {convs.map((c) => (
                  <motion.div key={c.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}
                    className="group flex items-center gap-3 p-4 rounded-2xl border border-border bg-card/40 hover:bg-accent transition-colors duration-300" data-testid="conversation-item">
                    <MessageCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                    <button onClick={() => navigate(`/app/chat/${c.id}`)} className="flex-1 text-left min-w-0">
                      <div className="text-sm truncate">{c.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{fmt(c.updated_at)}</div>
                    </button>
                    <button onClick={() => remove(c.id)} data-testid="delete-conversation"
                      className="grid place-items-center w-8 h-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookmarks" className="mt-5">
          {bookmarks.length === 0 ? (
            <div className="text-center py-14 text-muted-foreground"><Bookmark className="w-10 h-10 mx-auto mb-3 opacity-40" />{t(lang, "no_bookmarks")}</div>
          ) : (
            <div className="space-y-2">
              {bookmarks.map((b) => (
                <div key={b.id} className="flex items-start gap-3 p-4 rounded-2xl border border-border bg-card/40" data-testid="bookmark-item">
                  <Bookmark className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <button onClick={() => navigate(`/app/chat/${b.conversation_id}`)} className="flex-1 text-left text-sm line-clamp-3">{b.content}</button>
                  <button onClick={() => removeBm(b.id)} className="grid place-items-center w-8 h-8 rounded-full text-muted-foreground hover:text-destructive transition-colors duration-300"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
