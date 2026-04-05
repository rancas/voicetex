import { useState } from "react";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface ConversationState {
  latexOutput: string;
  isLoading: boolean;
  hasPreviousExpression: boolean;
  conversationHistory: ChatMessage[];
  error: string | null;
  sendToLLM: (text: string) => Promise<void>;
  editLatex: (editInstruction: string) => Promise<void>;
  setLatexOutput: (latex: string) => void;
  loadState: (latex: string) => void;
  resetConversation: () => void;
}

const SYSTEM_PROMPT = `You are a LaTeX expression generator. Convert the user's spoken math description into a valid LaTeX expression. The user may speak in any language. Return ONLY the LaTeX code without any explanations, markdown formatting, or backticks. Do not include any text before or after the LaTeX expression. Do not include any $ symbols.`;

interface StreamResult {
  text: string;
  usage: TokenUsage | null;
}

async function streamChatCompletion(
  apiKey: string,
  llmModel: string,
  messages: ChatMessage[],
  onChunk: (text: string) => void,
): Promise<StreamResult> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: llmModel,
      messages,
      temperature: 0.3,
      stream: true,
      stream_options: { include_usage: true },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    if (response.status === 401) {
      throw new Error("Invalid API key. Please check your OpenAI API key.");
    }
    if (response.status === 429) {
      throw new Error(
        "Rate limit exceeded. Please wait a moment and try again.",
      );
    }
    throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let fullResponse = "";
  let buffer = "";
  let usage: TokenUsage | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;
      const data = trimmed.slice(6);
      if (data === "[DONE]") break;

      try {
        const parsed = JSON.parse(data);

        // Check for usage in the final chunk
        if (parsed.usage) {
          usage = {
            promptTokens: parsed.usage.prompt_tokens ?? 0,
            completionTokens: parsed.usage.completion_tokens ?? 0,
          };
        }

        const content = parsed.choices?.[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          onChunk(fullResponse);
        }
      } catch {
        // skip malformed chunks
      }
    }
  }

  return { text: fullResponse, usage };
}

export function useConversation(
  apiKey: string,
  llmModel: string,
  onLlmUsage?: (model: string, inputTokens: number, outputTokens: number) => void,
  onLatexGenerated?: (latex: string, source: string, transcript?: string) => void,
): ConversationState {
  const [latexOutput, setLatexOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasPreviousExpression, setHasPreviousExpression] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<
    ChatMessage[]
  >([{ role: "system", content: SYSTEM_PROMPT }]);

  const reportUsage = (usage: TokenUsage | null) => {
    if (usage && onLlmUsage) {
      onLlmUsage(llmModel, usage.promptTokens, usage.completionTokens);
    }
  };

  const sendToLLM = async (text: string) => {
    if (!text.trim() || !apiKey) return;

    setIsLoading(true);
    setError(null);

    try {
      const userMessage: ChatMessage = {
        role: "user",
        content: hasPreviousExpression
          ? `Modify the previous LaTeX expression based on this instruction: "${text.trim()}"`
          : `Convert this math description to LaTeX: "${text.trim()}"`,
      };

      const updatedHistory = [...conversationHistory, userMessage];
      setConversationHistory(updatedHistory);

      const result = await streamChatCompletion(
        apiKey,
        llmModel,
        updatedHistory,
        setLatexOutput,
      );

      setConversationHistory([
        ...updatedHistory,
        { role: "assistant", content: result.text },
      ]);
      setHasPreviousExpression(true);
      reportUsage(result.usage);
      onLatexGenerated?.(result.text, "voice", text.trim());
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const editLatex = async (editInstruction: string) => {
    if (!editInstruction.trim() || !apiKey || !latexOutput) return;

    setIsLoading(true);
    setError(null);

    try {
      const editMessage: ChatMessage = {
        role: "user",
        content: `Here is the current LaTeX expression:\n\`\`\`\n${latexOutput}\n\`\`\`\nModify it based on this instruction: "${editInstruction.trim()}". Return ONLY the corrected LaTeX expression.`,
      };

      const editHistory: ChatMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
        editMessage,
      ];

      const result = await streamChatCompletion(
        apiKey,
        llmModel,
        editHistory,
        setLatexOutput,
      );

      setConversationHistory([
        ...editHistory,
        { role: "assistant", content: result.text },
      ]);
      setHasPreviousExpression(true);
      reportUsage(result.usage);
      onLatexGenerated?.(result.text, "voice_edit", editInstruction.trim());
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadState = (latex: string) => {
    setLatexOutput(latex);
    setHasPreviousExpression(!!latex);
    setConversationHistory([{ role: "system", content: SYSTEM_PROMPT }]);
  };

  const resetConversation = () => {
    setLatexOutput("");
    setHasPreviousExpression(false);
    setError(null);
    setConversationHistory([{ role: "system", content: SYSTEM_PROMPT }]);
  };

  return {
    latexOutput,
    isLoading,
    hasPreviousExpression,
    conversationHistory,
    error,
    sendToLLM,
    editLatex,
    setLatexOutput,
    loadState,
    resetConversation,
  };
}
