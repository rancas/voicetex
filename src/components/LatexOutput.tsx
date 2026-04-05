import { ResetIcon } from "../assets/icons/ResetIcon";
import { CopyButtonIcon } from "../assets/icons/CopyButtonIcon";
import { CheckmarkIcon } from "../assets/icons/CheckmarkIcon";
import { LoadingSpinner } from "../assets/icons/LoadingSpinner";
import LatexRenderer from "./LatexRenderer";
import { useState, useEffect, useRef } from "react";

interface LatexOutputProps {
  latexOutput: string;
  hasPreviousExpression: boolean;
  onReset: () => void;
  onLatexChange: (latex: string) => void;
  isLoading?: boolean;
  error?: string | null;
  isEditing?: boolean;
  onEditToggle?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function LatexOutput({
  latexOutput,
  hasPreviousExpression,
  onReset,
  onLatexChange,
  isLoading = false,
  error = null,
  isEditing = false,
  onEditToggle,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}: LatexOutputProps) {
  const [copied, setCopied] = useState(false);
  const [isManualEdit, setIsManualEdit] = useState(false);
  const [editValue, setEditValue] = useState(latexOutput);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync edit value when latexOutput changes externally
  useEffect(() => {
    if (!isManualEdit) {
      setEditValue(latexOutput);
    }
  }, [latexOutput, isManualEdit]);

  const handleCopy = () => {
    navigator.clipboard.writeText(latexOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleManualEditStart = () => {
    setEditValue(latexOutput);
    setIsManualEdit(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleManualEditSave = () => {
    onLatexChange(editValue);
    setIsManualEdit(false);
  };

  const handleManualEditCancel = () => {
    setEditValue(latexOutput);
    setIsManualEdit(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleManualEditSave();
    }
    if (e.key === "Escape") {
      handleManualEditCancel();
    }
  };

  return (
    <div
      className={`bg-[--bg-primary] p-4 sm:p-6 rounded-xl shadow-lg mb-6 sm:mb-8 min-h-[200px] border w-full ${
        isEditing
          ? "border-[var(--color-accent-purple)] ring-2 ring-[var(--color-accent-purple)]/30"
          : "border-[--border-color]"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-[--text-primary]">
          LaTeX Expression
        </h2>
        {hasPreviousExpression && (
          <div className="flex items-center gap-2">
            {/* Undo/Redo */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="p-1.5 bg-[--bg-secondary] hover:opacity-90 text-[--text-primary] rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Undo (Ctrl+Z)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
                </svg>
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className="p-1.5 bg-[--bg-secondary] hover:opacity-90 text-[--text-primary] rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Redo (Ctrl+Shift+Z)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a5 5 0 00-5 5v2M21 10l-4-4M21 10l-4 4" />
                </svg>
              </button>
            </div>
            <button
              onClick={onEditToggle}
              className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors text-sm ${
                isEditing
                  ? "bg-[var(--color-accent-purple)] text-white"
                  : "bg-[--bg-secondary] hover:opacity-90 text-[--text-primary]"
              }`}
              title={isEditing ? "Cancel voice edit" : "Voice edit"}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 1a3 3 0 00-3 3v4a3 3 0 006 0V4a3 3 0 00-3-3z"
                />
              </svg>
              <span>{isEditing ? "Cancel" : "Voice"}</span>
            </button>
            <button
              onClick={onReset}
              className="flex items-center gap-1 px-3 py-1 bg-[--bg-secondary] hover:opacity-90 text-[--text-primary] rounded-md transition-colors"
              title="Reset conversation"
            >
              <ResetIcon className="w-4 h-4" />
              <span className="text-sm">Reset</span>
            </button>
          </div>
        )}
      </div>

      {/* Editing indicator */}
      {isEditing && (
        <div className="mb-3 p-2 bg-[var(--color-accent-purple)]/10 border border-[var(--color-accent-purple)]/30 rounded-lg text-[var(--color-accent-purple)] text-sm text-center">
          Voice edit mode: dictate the correction to apply
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Rendered LaTeX */}
      <div className="p-4 bg-[--bg-secondary] rounded-lg min-h-[120px] flex flex-col items-center justify-center mb-3">
        <div className="w-full">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center mb-2">
                <LoadingSpinner className="animate-spin h-5 w-5 text-[var(--color-accent-blue)]" />
                <span className="ml-2 text-[--text-primary]">
                  {isEditing
                    ? "Applying correction..."
                    : "Converting speech to LaTeX..."}
                </span>
              </div>
            </div>
          ) : latexOutput ? (
            <LatexRenderer latex={latexOutput} />
          ) : (
            <p className="text-[--text-secondary] italic">
              LaTeX rendering will appear here...
            </p>
          )}
        </div>
      </div>

      {/* Raw LaTeX Code - editable or readonly */}
      {(latexOutput || isManualEdit) && (
        <div className="relative bg-[--bg-secondary] rounded-lg p-3 mt-2">
          {isManualEdit ? (
            <>
              <textarea
                ref={textareaRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent text-sm text-[--text-primary] font-mono resize-y min-h-[60px] focus:outline-none"
                rows={3}
              />
              <div className="flex items-center justify-end gap-2 mt-2 border-t border-[--border-color] pt-2">
                <span className="text-xs text-[--text-secondary] mr-auto">
                  Ctrl+Enter to save, Esc to cancel
                </span>
                <button
                  onClick={handleManualEditCancel}
                  className="px-3 py-1 text-sm bg-[--bg-primary] hover:opacity-90 text-[--text-primary] rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualEditSave}
                  className="px-3 py-1 text-sm bg-[var(--color-accent-blue)] hover:opacity-90 text-white rounded-md transition-colors"
                >
                  Save
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="absolute top-2 left-2 flex gap-1 z-10">
                <button
                  onClick={handleCopy}
                  className={`p-1.5 ${
                    copied
                      ? "bg-[var(--color-accent-green-light)] text-[var(--color-accent-green)]"
                      : "bg-[--bg-primary] hover:opacity-90 text-[--text-primary]"
                  } rounded-md transition-all duration-200`}
                  title={copied ? "Copied!" : "Copy LaTeX"}
                >
                  {copied ? (
                    <CheckmarkIcon className="w-5 h-5" />
                  ) : (
                    <CopyButtonIcon className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={handleManualEditStart}
                  className="p-1.5 bg-[--bg-primary] hover:opacity-90 text-[--text-primary] rounded-md transition-all duration-200"
                  title="Edit LaTeX manually"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              </div>
              <div className="overflow-x-auto">
                <pre className="text-sm text-[--text-primary] font-mono pl-16 whitespace-pre">
                  {latexOutput}
                </pre>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
