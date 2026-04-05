import { AudioManager } from "./AudioManager";
import { Transcriber } from "../hooks/useTranscriber";

interface AudioSectionProps {
  transcriber: Transcriber;
  onTranscriptReady: (text: string) => void;
  isWhisperModelLoading: boolean;
  hasPreviousExpression: boolean;
  isEditing?: boolean;
}

export function AudioSection({
  transcriber,
  onTranscriptReady,
  isWhisperModelLoading,
  hasPreviousExpression,
  isEditing = false,
}: AudioSectionProps) {
  const title = isEditing
    ? "Dictate Correction"
    : hasPreviousExpression
      ? "Modify Expression"
      : "Dictate Math Expression";

  return (
    <div
      className={`w-full p-4 sm:p-6 md:p-8 rounded-xl shadow-lg text-white text-center mb-4 sm:mb-6 ${
        isEditing
          ? "bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-blue)]"
          : "bg-gradient-to-r from-[var(--color-accent-blue)] to-[var(--color-accent-purple)] dark:from-[var(--color-dark-bg-primary)] dark:to-[var(--color-accent-purple)]"
      }`}
    >
      <h2 className="text-xl sm:text-2xl font-bold mb-6">{title}</h2>
      <AudioManager
        transcriber={transcriber}
        onTranscriptReady={onTranscriptReady}
        isModelLoading={isWhisperModelLoading}
      />
    </div>
  );
}
