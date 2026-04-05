import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "../api/client";

export interface Session {
  id: string;
  name: string;
  current_history_id: number | null;
  created_at: string;
  updated_at: string;
  settings: string;
}

export function useSession() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(
    () => localStorage.getItem("current-session-id"),
  );
  const [sessionName, setSessionName] = useState("");

  const loadSessions = useCallback(async (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const query = params.toString() ? `?${params}` : "";
    const data = await apiGet<Session[]>(`/sessions${query}`);
    setSessions(data);
    return data;
  }, []);

  const createSession = useCallback(async () => {
    const session = await apiPost<Session>("/sessions");
    setSessions((prev) => [session, ...prev]);
    setSessionId(session.id);
    setSessionName(session.name);
    localStorage.setItem("current-session-id", session.id);
    return session;
  }, []);

  const loadSession = useCallback(
    async (id: string) => {
      const session = await apiGet<Session>(`/sessions/${id}`);
      setSessionId(session.id);
      setSessionName(session.name);
      localStorage.setItem("current-session-id", session.id);
      return session;
    },
    [],
  );

  const renameSession = useCallback(
    async (name: string) => {
      if (!sessionId) return;
      await apiPatch<Session>(`/sessions/${sessionId}`, { name });
      setSessionName(name);
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, name } : s)),
      );
    },
    [sessionId],
  );

  const deleteSession = useCallback(
    async (id: string) => {
      await apiDelete(`/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (sessionId === id) {
        setSessionId(null);
        setSessionName("");
        localStorage.removeItem("current-session-id");
      }
    },
    [sessionId],
  );

  const saveSettings = useCallback(
    async (settings: Record<string, unknown>) => {
      if (!sessionId) return;
      await apiPatch(`/sessions/${sessionId}`, { settings });
    },
    [sessionId],
  );

  // Load sessions on mount and restore last session
  useEffect(() => {
    const init = async () => {
      const data = await loadSessions();
      if (sessionId) {
        const existing = data.find((s) => s.id === sessionId);
        if (existing) {
          setSessionName(existing.name);
        } else {
          setSessionId(null);
          localStorage.removeItem("current-session-id");
        }
      }
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    sessions,
    sessionId,
    sessionName,
    loadSessions,
    createSession,
    loadSession,
    renameSession,
    deleteSession,
    saveSettings,
  };
}
