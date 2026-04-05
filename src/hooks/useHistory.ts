import { useState, useCallback, useEffect } from "react";
import { apiGet, apiPost } from "../api/client";

export interface HistoryEntry {
  id: number;
  session_id: string;
  latex_content: string;
  source: string;
  transcript: string | null;
  created_at: string;
}

export function useHistory(
  sessionId: string | null,
  onSessionLoaded?: (latex: string) => void,
) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < entries.length - 1;

  // Load history when session changes
  useEffect(() => {
    if (!sessionId) {
      setEntries([]);
      setCurrentIndex(-1);
      return;
    }

    const load = async () => {
      const [historyData, sessionData] = await Promise.all([
        apiGet<HistoryEntry[]>(`/sessions/${sessionId}/history`),
        apiGet<{ current_history_id: number | null }>(`/sessions/${sessionId}`),
      ]);
      setEntries(historyData);
      const idx = historyData.findIndex(
        (e) => e.id === sessionData.current_history_id,
      );
      const resolvedIdx = idx >= 0 ? idx : historyData.length - 1;
      setCurrentIndex(resolvedIdx);

      // Notify parent of the loaded latex
      const entry = historyData[resolvedIdx];
      onSessionLoaded?.(entry?.latex_content ?? "");
    };
    load();
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const addEntry = useCallback(
    async (latexContent: string, source: string, transcript?: string) => {
      if (!sessionId) return;
      const entry = await apiPost<HistoryEntry>(
        `/sessions/${sessionId}/history`,
        { latex_content: latexContent, source, transcript },
      );
      // Truncate entries after current locally, then append
      setEntries((prev) => [...prev.slice(0, currentIndex + 1), entry]);
      setCurrentIndex((prev) => prev + 1);
    },
    [sessionId, currentIndex],
  );

  const undo = useCallback(async () => {
    if (!sessionId || !canUndo) return null;
    const entry = await apiPost<HistoryEntry>(
      `/sessions/${sessionId}/history/undo`,
    );
    setCurrentIndex((prev) => prev - 1);
    return entry;
  }, [sessionId, canUndo]);

  const redo = useCallback(async () => {
    if (!sessionId || !canRedo) return null;
    const entry = await apiPost<HistoryEntry>(
      `/sessions/${sessionId}/history/redo`,
    );
    setCurrentIndex((prev) => prev + 1);
    return entry;
  }, [sessionId, canRedo]);

  const currentEntry = entries[currentIndex] ?? null;

  return {
    entries,
    currentIndex,
    currentEntry,
    canUndo,
    canRedo,
    addEntry,
    undo,
    redo,
  };
}
