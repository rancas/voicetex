import { useState } from "react";
import { CheckmarkIcon } from "../assets/icons/CheckmarkIcon";

interface ApiKeyInputProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

export function ApiKeyInput({ apiKey, onApiKeyChange }: ApiKeyInputProps) {
  const [inputValue, setInputValue] = useState(apiKey);
  const [isEditing, setIsEditing] = useState(!apiKey);
  const [error, setError] = useState("");

  const handleSave = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setError("API key is required");
      return;
    }
    if (!trimmed.startsWith("sk-")) {
      setError("Invalid API key format (should start with sk-)");
      return;
    }
    setError("");
    onApiKeyChange(trimmed);
    setIsEditing(false);
  };

  const handleClear = () => {
    setInputValue("");
    onApiKeyChange("");
    setIsEditing(true);
    setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
  };

  if (!isEditing && apiKey) {
    return (
      <div>
        <label className="block text-sm font-medium mb-2 text-[--text-primary]">
          OpenAI API Key
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-[--bg-secondary] rounded-lg border border-[--border-color] text-[--text-primary]">
            <CheckmarkIcon className="w-4 h-4 text-[var(--color-accent-green)]" />
            <span className="text-sm">sk-...{apiKey.slice(-4)}</span>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-2 text-sm bg-[--bg-secondary] hover:opacity-90 text-[--text-primary] rounded-lg border border-[--border-color] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-2 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg border border-red-500/30 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-[--text-primary]">
        OpenAI API Key
      </label>
      <div className="flex items-center gap-2">
        <input
          type="password"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setError("");
          }}
          onKeyDown={handleKeyDown}
          placeholder="sk-..."
          className="flex-1 px-3 py-2 bg-[--bg-secondary] rounded-lg border border-[--border-color] text-[--text-primary] text-sm placeholder:text-[--text-secondary] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)]"
        />
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm bg-[var(--color-accent-blue)] hover:opacity-90 text-white rounded-lg transition-colors"
        >
          Save
        </button>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
