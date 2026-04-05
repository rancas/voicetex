import { useState, useEffect, useCallback, useRef } from "react";
import { useTranscriber } from "./hooks/useTranscriber";
import type { TranscriberBackend } from "./hooks/useTranscriber";
import { useOpenAITranscriber } from "./hooks/useOpenAITranscriber";
import { useSession } from "./hooks/useSession";
import { useHistory } from "./hooks/useHistory";
import { ModelSelectionPanel } from "./components/ModelSelectionPanel";
import { LatexOutput } from "./components/LatexOutput";
import { AudioSection } from "./components/AudioSection";
import { Sidebar } from "./components/Sidebar";
import { useConversation } from "./hooks/useConversation";
import { useCostTracker } from "./hooks/useCostTracker";
import { CostDisplay } from "./components/CostDisplay";
import { DarkModeToggle } from "./components/DarkModeToggle";
import { GitHubIcon } from "./assets/icons/GitHubIcon";

function App() {
  const [whisperModel, setWhisperModel] = useState("Xenova/whisper-tiny");
  const [isWhisperModelLoading, setIsWhisperModelLoading] = useState(false);
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("openai-api-key") || "",
  );
  const [transcriberBackend, setTranscriberBackend] =
    useState<TranscriberBackend>(
      () =>
        (localStorage.getItem("transcriber-backend") as TranscriberBackend) ||
        "local",
    );
  const [language, setLanguage] = useState(
    () => localStorage.getItem("transcriber-language") || "auto",
  );
  const [llmModel, setLlmModel] = useState(
    () => localStorage.getItem("llm-model") || "gpt-4.1-mini",
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Session & History
  const {
    sessions,
    sessionId,
    loadSessions,
    createSession,
    loadSession,
    deleteSession,
  } = useSession();

  const handleSessionLoaded = useCallback(
    (latex: string) => {
      // Will be wired after useConversation is created
      loadStateRef.current?.(latex);
    },
    [],
  );

  const loadStateRef = useRef<((latex: string) => void) | null>(null);

  const {
    canUndo,
    canRedo,
    addEntry,
    undo,
    redo,
  } = useHistory(sessionId, handleSessionLoaded);

  const { costs, addLlmUsage, addTranscriptionUsage, resetCosts } =
    useCostTracker();

  // Both transcriber hooks must always be called
  const localTranscriber = useTranscriber();
  const openaiTranscriber = useOpenAITranscriber(
    apiKey,
    addTranscriptionUsage,
  );
  const transcriber =
    transcriberBackend === "local" ? localTranscriber : openaiTranscriber;

  const [isEditing, setIsEditing] = useState(false);

  const handleLatexGenerated = useCallback(
    (latex: string, source: string, transcript?: string) => {
      addEntry(latex, source, transcript);
    },
    [addEntry],
  );

  const {
    latexOutput,
    isLoading,
    hasPreviousExpression,
    error,
    sendToLLM,
    editLatex,
    setLatexOutput,
    loadState,
    resetConversation,
  } = useConversation(apiKey, llmModel, addLlmUsage, handleLatexGenerated);

  // Wire the ref so the history callback can call loadState
  loadStateRef.current = loadState;

  const handleTranscriptReady = (text: string) => {
    if (isEditing) {
      editLatex(text);
      setIsEditing(false);
    } else {
      sendToLLM(text);
    }
  };

  const handleReset = () => {
    resetConversation();
    setIsEditing(false);
  };

  const handleManualLatexChange = (latex: string) => {
    setLatexOutput(latex);
    addEntry(latex, "manual_edit");
  };

  const handleUndo = async () => {
    const entry = await undo();
    if (entry) {
      setLatexOutput(entry.latex_content);
    }
  };

  const handleRedo = async () => {
    const entry = await redo();
    if (entry) {
      setLatexOutput(entry.latex_content);
    }
  };

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return;

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "Z" || (e.key === "z" && e.shiftKey) || e.key === "y")
      ) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }); // intentionally no deps - uses latest handler refs

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem("openai-api-key", key);
    } else {
      localStorage.removeItem("openai-api-key");
    }
  };

  const handleTranscriberBackendChange = (backend: TranscriberBackend) => {
    setTranscriberBackend(backend);
    localStorage.setItem("transcriber-backend", backend);
  };

  const handleLlmModelChange = (model: string) => {
    setLlmModel(model);
    localStorage.setItem("llm-model", model);
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("transcriber-language", lang);
    localTranscriber.setLanguage(lang);
    openaiTranscriber.setLanguage(lang);
  };

  useEffect(() => {
    localTranscriber.setLanguage(language);
    localTranscriber.setMultilingual(language !== "english");
    openaiTranscriber.setLanguage(language);
  }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (transcriberBackend !== "local") return;
    const loadModel = async () => {
      setIsWhisperModelLoading(true);
      await localTranscriber.setModel(whisperModel);
      setIsWhisperModelLoading(false);
    };
    loadModel();
  }, [whisperModel, transcriberBackend]);

  const handleSelectSession = async (id: string) => {
    await loadSession(id);
  };

  const handleCreateSession = async () => {
    await createSession();
    resetConversation();
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Delete this session?")) return;
    await deleteSession(id);
  };

  const handleFilterChange = (from: string, to: string) => {
    loadSessions(from || undefined, to || undefined);
  };

  return (
    <div className="min-h-screen bg-[--bg-primary] flex">
      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={sessionId}
        onCreateSession={handleCreateSession}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onFilterChange={handleFilterChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 min-w-0 overflow-auto">
        <div className="mx-auto p-4 sm:p-6 flex flex-col items-center max-w-4xl w-full">
          <div className="w-full flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-center flex-grow text-[var(--color-accent-blue)] tracking-tight">
              VoiceTeX
            </h1>
            <DarkModeToggle />
          </div>

          {!sessionId ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-lg text-[--text-secondary] mb-4">
                Select a session from the sidebar or create a new one.
              </p>
              <button
                onClick={handleCreateSession}
                className="px-6 py-3 bg-[var(--color-accent-blue)] hover:opacity-90 text-white rounded-lg font-medium transition-colors"
              >
                New Session
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full max-w-full">
              <LatexOutput
                latexOutput={latexOutput}
                hasPreviousExpression={hasPreviousExpression}
                onReset={handleReset}
                onLatexChange={handleManualLatexChange}
                isLoading={isLoading}
                error={error}
                isEditing={isEditing}
                onEditToggle={() => setIsEditing(!isEditing)}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={handleUndo}
                onRedo={handleRedo}
              />

              <AudioSection
                transcriber={transcriber}
                onTranscriptReady={handleTranscriptReady}
                isWhisperModelLoading={
                  transcriberBackend === "local"
                    ? isWhisperModelLoading
                    : false
                }
                hasPreviousExpression={hasPreviousExpression}
                isEditing={isEditing}
              />

              <div className="w-full max-w-full">
                <CostDisplay costs={costs} onReset={resetCosts} />
              </div>

              <div className="w-full max-w-full">
                <ModelSelectionPanel
                  apiKey={apiKey}
                  onApiKeyChange={handleApiKeyChange}
                  transcriberBackend={transcriberBackend}
                  setTranscriberBackend={handleTranscriberBackendChange}
                  whisperModel={whisperModel}
                  setWhisperModel={setWhisperModel}
                  openaiTranscriberModel={openaiTranscriber.model}
                  setOpenaiTranscriberModel={openaiTranscriber.setModel}
                  isWhisperModelLoading={isWhisperModelLoading}
                  language={language}
                  setLanguage={handleLanguageChange}
                  llmModel={llmModel}
                  setLlmModel={handleLlmModelChange}
                />
              </div>
            </div>
          )}
        </div>

        <footer className="w-full py-4 mt-8 flex justify-center">
          <a
            href="https://github.com/Thomas-McKanna/speech-to-latex"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--color-accent-blue)] transition-colors"
          >
            <GitHubIcon className="h-5 w-5" />
            <span>View on GitHub</span>
          </a>
        </footer>
      </div>
    </div>
  );
}

export default App;
