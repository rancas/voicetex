import { ModelSelector } from "./ModelSelector";
import { ApiKeyInput } from "./ApiKeyInput";
import type { TranscriberBackend } from "../hooks/useTranscriber";

interface ModelSelectionPanelProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  transcriberBackend: TranscriberBackend;
  setTranscriberBackend: (backend: TranscriberBackend) => void;
  whisperModel: string;
  setWhisperModel: (model: string) => void;
  openaiTranscriberModel: string;
  setOpenaiTranscriberModel: (model: string) => void;
  isWhisperModelLoading: boolean;
  language: string;
  setLanguage: (lang: string) => void;
  llmModel: string;
  setLlmModel: (model: string) => void;
}

export function ModelSelectionPanel({
  apiKey,
  onApiKeyChange,
  transcriberBackend,
  setTranscriberBackend,
  whisperModel,
  setWhisperModel,
  openaiTranscriberModel,
  setOpenaiTranscriberModel,
  isWhisperModelLoading,
  language,
  setLanguage,
  llmModel,
  setLlmModel,
}: ModelSelectionPanelProps) {
  return (
    <div className="w-full bg-[--bg-primary] p-5 rounded-lg shadow-md border border-[--border-color] mb-6">
      <h2 className="text-xl font-semibold mb-4 text-[--text-primary]">
        Settings
      </h2>

      {/* Row 1: API Key + LLM Model */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="w-full">
          <ApiKeyInput apiKey={apiKey} onApiKeyChange={onApiKeyChange} />
        </div>

        <div className="w-full">
          <ModelSelector
            label="LLM Model (Text to LaTeX)"
            model={llmModel}
            onChange={setLlmModel}
            disabled={false}
          >
            <optgroup label="GPT-5.4 (Latest Flagship)">
              <option value="gpt-5.4">GPT-5.4 ($2.50/$15)</option>
              <option value="gpt-5.4-mini">GPT-5.4 Mini ($0.75/$4.50)</option>
              <option value="gpt-5.4-nano">GPT-5.4 Nano ($0.20/$1.25)</option>
              <option value="gpt-5.4-pro">GPT-5.4 Pro ($30/$180)</option>
            </optgroup>
            <optgroup label="GPT-5">
              <option value="gpt-5">GPT-5 ($1.25/$10)</option>
              <option value="gpt-5-mini">GPT-5 Mini ($0.25/$2)</option>
              <option value="gpt-5-nano">GPT-5 Nano ($0.05/$0.40)</option>
            </optgroup>
            <optgroup label="GPT-5.3">
              <option value="gpt-5.3-chat-latest">GPT-5.3 Chat ($1.75/$14)</option>
            </optgroup>
            <optgroup label="GPT-5.2">
              <option value="gpt-5.2">GPT-5.2 ($1.75/$14)</option>
              <option value="gpt-5.2-pro">GPT-5.2 Pro ($10.50/$84)</option>
            </optgroup>
            <optgroup label="GPT-5.1">
              <option value="gpt-5.1">GPT-5.1 ($1.25/$10)</option>
            </optgroup>
            <optgroup label="GPT-4.1 (1M Context, Coding)">
              <option value="gpt-4.1">GPT-4.1 ($2/$8)</option>
              <option value="gpt-4.1-mini">GPT-4.1 Mini ($0.40/$1.60)</option>
              <option value="gpt-4.1-nano">GPT-4.1 Nano ($0.10/$0.40)</option>
            </optgroup>
            <optgroup label="GPT-4o">
              <option value="gpt-4o">GPT-4o ($2.50/$10)</option>
              <option value="gpt-4o-mini">GPT-4o Mini ($0.15/$0.60)</option>
            </optgroup>
            <optgroup label="O-Series (Reasoning)">
              <option value="o3">o3 ($2/$8)</option>
              <option value="o3-mini">o3-mini ($1.10/$4.40)</option>
              <option value="o3-pro">o3-pro ($20/$80)</option>
              <option value="o4-mini">o4-mini ($1.10/$4.40)</option>
              <option value="o1">o1 ($15/$60)</option>
              <option value="o1-mini">o1-mini ($0.55/$2.20)</option>
            </optgroup>
            <optgroup label="Legacy">
              <option value="gpt-4-turbo">GPT-4 Turbo ($5/$15)</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo ($0.50/$1.50)</option>
            </optgroup>
          </ModelSelector>
        </div>
      </div>

      {/* Row 2: Transcription + Language */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transcription Backend + Model */}
        <div className="w-full">
          <label className="block text-sm font-medium mb-2 text-[--text-primary]">
            Transcription
          </label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-[--text-primary]">
              <input
                type="radio"
                name="transcriber-backend"
                value="local"
                checked={transcriberBackend === "local"}
                onChange={() => setTranscriberBackend("local")}
                className="accent-[var(--color-accent-blue)]"
              />
              Local (Whisper)
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-[--text-primary]">
              <input
                type="radio"
                name="transcriber-backend"
                value="openai"
                checked={transcriberBackend === "openai"}
                onChange={() => setTranscriberBackend("openai")}
                className="accent-[var(--color-accent-blue)]"
              />
              OpenAI API
            </label>
          </div>

          {transcriberBackend === "local" ? (
            <ModelSelector
              label=""
              model={whisperModel}
              onChange={setWhisperModel}
              disabled={isWhisperModelLoading}
            >
              <option value="Xenova/whisper-tiny">Whisper Tiny (41MB)</option>
              <option value="Xenova/whisper-base">Whisper Base (77MB)</option>
              <option value="Xenova/whisper-small">
                Whisper Small (249MB)
              </option>
              <option value="distil-whisper/distil-medium.en">
                Distil Medium (402MB)
              </option>
            </ModelSelector>
          ) : (
            <>
              <ModelSelector
                label=""
                model={openaiTranscriberModel}
                onChange={setOpenaiTranscriberModel}
                disabled={false}
              >
                <option value="gpt-4o-mini-transcribe">
                  GPT-4o Mini Transcribe (recommended)
                </option>
                <option value="gpt-4o-transcribe">GPT-4o Transcribe</option>
              </ModelSelector>
              {!apiKey && (
                <p className="mt-2 text-sm text-amber-500">
                  An OpenAI API key is required for this option.
                </p>
              )}
            </>
          )}
        </div>

        {/* Language */}
        <div className="w-full">
          <ModelSelector
            label="Language"
            model={language}
            onChange={setLanguage}
            disabled={false}
          >
            <option value="auto">Auto-detect</option>
            <option value="italian">Italiano</option>
            <option value="english">English</option>
            <option value="french">Fran&ccedil;ais</option>
            <option value="german">Deutsch</option>
            <option value="spanish">Espa&ntilde;ol</option>
            <option value="portuguese">Portugu&ecirc;s</option>
            <option value="chinese">Chinese</option>
            <option value="japanese">Japanese</option>
            <option value="korean">Korean</option>
            <option value="russian">Russian</option>
            <option value="arabic">Arabic</option>
            <option value="hindi">Hindi</option>
            <option value="dutch">Nederlands</option>
            <option value="polish">Polski</option>
            <option value="turkish">T&uuml;rk&ccedil;e</option>
            <option value="swedish">Svenska</option>
            <option value="czech">Czech</option>
            <option value="greek">Greek</option>
            <option value="romanian">Romanian</option>
            <option value="hungarian">Magyar</option>
          </ModelSelector>
        </div>
      </div>
    </div>
  );
}
