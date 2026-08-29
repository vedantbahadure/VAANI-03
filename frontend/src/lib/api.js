import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const http = axios.create({ baseURL: API });

// ---- REST helpers ----
export const getSystemStatus = () => http.get("/system/status").then((r) => r.data);
export const getHardware = () => http.get("/hardware/capabilities").then((r) => r.data);
export const listConversations = () => http.get("/conversations").then((r) => r.data);
export const getConversation = (id) => http.get(`/conversations/${id}`).then((r) => r.data);
export const deleteConversation = (id) => http.delete(`/conversations/${id}`).then((r) => r.data);
export const searchConversations = (q) =>
  http.get(`/conversations/search`, { params: { q } }).then((r) => r.data);
export const getKnowledge = (domain) =>
  http.get("/knowledge", { params: domain ? { domain } : {} }).then((r) => r.data);
export const getDomains = () => http.get("/knowledge/domains").then((r) => r.data);
export const searchKnowledge = (q, domain) =>
  http.get("/knowledge/search", { params: { q, ...(domain ? { domain } : {}) } }).then((r) => r.data);
export const listDocuments = () => http.get("/documents").then((r) => r.data);
export const uploadDocument = (file, domain, language) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("domain", domain);
  fd.append("language", language);
  return http.post("/documents/upload", fd).then((r) => r.data);
};
export const listBookmarks = () => http.get("/bookmarks").then((r) => r.data);
export const deleteDocument = (id) => http.delete(`/documents/${id}`).then((r) => r.data);
export const addBookmark = (b) => http.post("/bookmarks", b).then((r) => r.data);
export const deleteBookmark = (id) => http.delete(`/bookmarks/${id}`).then((r) => r.data);

export const transcribeAudio = (blob, language) => {
  const fd = new FormData();
  fd.append("audio", blob, "recording.webm");
  if (language) fd.append("language", language);
  return http.post("/voice/transcribe", fd).then((r) => r.data);
};

export const speak = async (text, voice = "alloy") => {
  const res = await fetch(`${API}/voice/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice }),
  });
  if (!res.ok) throw new Error("tts failed");
  const buf = await res.arrayBuffer();
  return URL.createObjectURL(new Blob([buf], { type: "audio/mpeg" }));
};

// ---- SSE streaming (chat + doc ask) ----
export async function streamChat(body, { onMeta, onToken, onDone, onError, signal }) {
  return streamSSE(`${API}/chat/stream`, body, { onMeta, onToken, onDone, onError, signal });
}
export async function streamDocAsk(docId, body, handlers) {
  return streamSSE(`${API}/documents/${docId}/ask`, body, handlers);
}

async function streamSSE(url, body, { onMeta, onToken, onDone, onError, signal }) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const events = buf.split("\n\n");
      buf = events.pop() || "";
      for (const raw of events) {
        const lines = raw.split("\n");
        let ev = "message";
        let data = "";
        for (const l of lines) {
          if (l.startsWith("event:")) ev = l.slice(6).trim();
          else if (l.startsWith("data:")) data += l.slice(5).trim();
        }
        if (!data) continue;
        const parsed = JSON.parse(data);
        if (ev === "meta") onMeta?.(parsed);
        else if (ev === "token") onToken?.(parsed.delta);
        else if (ev === "done") onDone?.(parsed);
        else if (ev === "error") onError?.(parsed);
      }
    }
  } catch (e) {
    if (e.name !== "AbortError") onError?.({ message: e.message });
  }
}
