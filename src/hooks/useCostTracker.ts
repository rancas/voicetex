import { useState, useCallback } from "react";

// Prices per 1M tokens (input/output) from OpenAI pricing page
const LLM_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-5.4": { input: 2.5, output: 15 },
  "gpt-5.4-mini": { input: 0.75, output: 4.5 },
  "gpt-5.4-nano": { input: 0.2, output: 1.25 },
  "gpt-5.4-pro": { input: 30, output: 180 },
  "gpt-5": { input: 1.25, output: 10 },
  "gpt-5-mini": { input: 0.25, output: 2 },
  "gpt-5-nano": { input: 0.05, output: 0.4 },
  "gpt-5.3-chat-latest": { input: 1.75, output: 14 },
  "gpt-5.2": { input: 1.75, output: 14 },
  "gpt-5.2-pro": { input: 10.5, output: 84 },
  "gpt-5.1": { input: 1.25, output: 10 },
  "gpt-4.1": { input: 2, output: 8 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-4.1-nano": { input: 0.1, output: 0.4 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "o3": { input: 2, output: 8 },
  "o3-mini": { input: 1.1, output: 4.4 },
  "o3-pro": { input: 20, output: 80 },
  "o4-mini": { input: 1.1, output: 4.4 },
  "o1": { input: 15, output: 60 },
  "o1-mini": { input: 0.55, output: 2.2 },
  "gpt-4-turbo": { input: 5, output: 15 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
};

// Prices per minute for audio transcription
const TRANSCRIPTION_PRICING: Record<string, number> = {
  "gpt-4o-mini-transcribe": 0.003,
  "gpt-4o-transcribe": 0.006,
};

export interface CostBreakdown {
  llmCost: number;
  transcriptionCost: number;
  totalCost: number;
  llmCalls: number;
  transcriptionCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalAudioSeconds: number;
}

export interface CostTracker {
  costs: CostBreakdown;
  addLlmUsage: (
    model: string,
    inputTokens: number,
    outputTokens: number,
  ) => void;
  addTranscriptionUsage: (model: string, durationSeconds: number) => void;
  resetCosts: () => void;
}

const INITIAL_COSTS: CostBreakdown = {
  llmCost: 0,
  transcriptionCost: 0,
  totalCost: 0,
  llmCalls: 0,
  transcriptionCalls: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalAudioSeconds: 0,
};

export function useCostTracker(): CostTracker {
  const [costs, setCosts] = useState<CostBreakdown>({ ...INITIAL_COSTS });

  const addLlmUsage = useCallback(
    (model: string, inputTokens: number, outputTokens: number) => {
      const pricing = LLM_PRICING[model];
      if (!pricing) return;

      const cost =
        (inputTokens / 1_000_000) * pricing.input +
        (outputTokens / 1_000_000) * pricing.output;

      setCosts((prev) => ({
        ...prev,
        llmCost: prev.llmCost + cost,
        totalCost: prev.totalCost + cost,
        llmCalls: prev.llmCalls + 1,
        totalInputTokens: prev.totalInputTokens + inputTokens,
        totalOutputTokens: prev.totalOutputTokens + outputTokens,
      }));
    },
    [],
  );

  const addTranscriptionUsage = useCallback(
    (model: string, durationSeconds: number) => {
      const pricePerMinute = TRANSCRIPTION_PRICING[model];
      if (!pricePerMinute) return;

      const cost = (durationSeconds / 60) * pricePerMinute;

      setCosts((prev) => ({
        ...prev,
        transcriptionCost: prev.transcriptionCost + cost,
        totalCost: prev.totalCost + cost,
        transcriptionCalls: prev.transcriptionCalls + 1,
        totalAudioSeconds: prev.totalAudioSeconds + durationSeconds,
      }));
    },
    [],
  );

  const resetCosts = useCallback(() => {
    setCosts({ ...INITIAL_COSTS });
  }, []);

  return { costs, addLlmUsage, addTranscriptionUsage, resetCosts };
}
