import type { CostBreakdown } from "../hooks/useCostTracker";

interface CostDisplayProps {
  costs: CostBreakdown;
  onReset: () => void;
}

function formatCost(cost: number): string {
  if (cost < 0.001) return "$0.000";
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(3)}`;
}

export function CostDisplay({ costs, onReset }: CostDisplayProps) {
  if (costs.llmCalls === 0 && costs.transcriptionCalls === 0) return null;

  return (
    <div className="w-full bg-[--bg-primary] p-3 rounded-lg shadow-md border border-[--border-color] mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-[--text-secondary]">
          <span className="font-medium text-[--text-primary]">
            Session cost: {formatCost(costs.totalCost)}
          </span>
          {costs.llmCalls > 0 && (
            <span title={`${costs.totalInputTokens.toLocaleString()} input + ${costs.totalOutputTokens.toLocaleString()} output tokens`}>
              LLM: {formatCost(costs.llmCost)} ({costs.llmCalls} calls)
            </span>
          )}
          {costs.transcriptionCalls > 0 && (
            <span title={`${Math.round(costs.totalAudioSeconds)}s of audio`}>
              Transcription: {formatCost(costs.transcriptionCost)} (
              {costs.transcriptionCalls} calls,{" "}
              {Math.round(costs.totalAudioSeconds)}s)
            </span>
          )}
        </div>
        <button
          onClick={onReset}
          className="text-xs px-2 py-1 bg-[--bg-secondary] hover:opacity-90 text-[--text-secondary] rounded transition-colors"
          title="Reset cost counter"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
