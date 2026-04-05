import { useCallback, useMemo, useState } from "react";
import Constants from "../utils/Constants";
import type { Transcriber, TranscriberData } from "./useTranscriber";

const LANGUAGE_TO_ISO: Record<string, string> = {
  english: "en",
  chinese: "zh",
  german: "de",
  spanish: "es",
  russian: "ru",
  korean: "ko",
  french: "fr",
  japanese: "ja",
  portuguese: "pt",
  turkish: "tr",
  polish: "pl",
  catalan: "ca",
  dutch: "nl",
  arabic: "ar",
  swedish: "sv",
  italian: "it",
  indonesian: "id",
  hindi: "hi",
  finnish: "fi",
  vietnamese: "vi",
  hebrew: "he",
  ukrainian: "uk",
  greek: "el",
  malay: "ms",
  czech: "cs",
  romanian: "ro",
  danish: "da",
  hungarian: "hu",
  tamil: "ta",
  norwegian: "no",
  thai: "th",
  urdu: "ur",
  croatian: "hr",
  bulgarian: "bg",
  lithuanian: "lt",
  latin: "la",
  maori: "mi",
  malayalam: "ml",
  welsh: "cy",
  slovak: "sk",
  telugu: "te",
  persian: "fa",
  latvian: "lv",
  bengali: "bn",
  serbian: "sr",
  azerbaijani: "az",
  slovenian: "sl",
  kannada: "kn",
  estonian: "et",
  macedonian: "mk",
  breton: "br",
  basque: "eu",
  icelandic: "is",
  armenian: "hy",
  nepali: "ne",
  mongolian: "mn",
  bosnian: "bs",
  kazakh: "kk",
  albanian: "sq",
  swahili: "sw",
  galician: "gl",
  marathi: "mr",
  punjabi: "pa",
  sinhala: "si",
  khmer: "km",
  shona: "sn",
  yoruba: "yo",
  somali: "so",
  afrikaans: "af",
  occitan: "oc",
  georgian: "ka",
  belarusian: "be",
  tajik: "tg",
  sindhi: "sd",
  gujarati: "gu",
  amharic: "am",
  yiddish: "yi",
  lao: "lo",
  uzbek: "uz",
  faroese: "fo",
  haitian: "ht",
  pashto: "ps",
  turkmen: "tk",
  maltese: "mt",
  sanskrit: "sa",
  luxembourgish: "lb",
  myanmar: "my",
  tibetan: "bo",
  tagalog: "tl",
  malagasy: "mg",
  assamese: "as",
  tatar: "tt",
  hawaiian: "haw",
  lingala: "ln",
  hausa: "ha",
  bashkir: "ba",
  javanese: "jw",
  sundanese: "su",
};

function toISOLanguage(lang: string): string | undefined {
  if (!lang || lang === "auto") return undefined;
  // Already an ISO code (2-3 chars)
  if (lang.length <= 3) return lang;
  return LANGUAGE_TO_ISO[lang.toLowerCase()];
}

function getFileExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "audio/webm": "webm",
    "audio/mp4": "mp4",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "audio/aac": "aac",
    "audio/flac": "flac",
    "audio/mpeg": "mp3",
  };
  return map[mimeType] || "webm";
}

export function useOpenAITranscriber(
  apiKey: string,
  onTranscriptionUsage?: (model: string, durationSeconds: number) => void,
): Transcriber {
  const [transcript, setTranscript] = useState<TranscriberData | undefined>(
    undefined,
  );
  const [isBusy, setIsBusy] = useState(false);
  const [model, setModel] = useState<string>(
    Constants.DEFAULT_OPENAI_TRANSCRIBER_MODEL,
  );
  const [language, setLanguage] = useState<string>(Constants.DEFAULT_LANGUAGE);

  // Whisper-specific fields (no-op for OpenAI)
  const [multilingual, setMultilingual] = useState(false);
  const [quantized, setQuantized] = useState(false);
  const [subtask, setSubtask] = useState(Constants.DEFAULT_SUBTASK);

  const onInputChange = useCallback(() => {
    setTranscript(undefined);
  }, []);

  const postRequest = useCallback(
    async (blob: Blob | undefined, durationMs?: number) => {
      if (!blob) return;

      if (!apiKey) {
        alert("Please enter your OpenAI API key in the Settings panel.");
        return;
      }

      setTranscript(undefined);
      setIsBusy(true);

      try {
        const ext = getFileExtension(blob.type);
        const formData = new FormData();
        formData.append("file", blob, `recording.${ext}`);
        formData.append("model", model);
        formData.append("response_format", "json");

        const isoLang = toISOLanguage(language);
        if (isoLang) {
          formData.append("language", isoLang);
        }

        const response = await fetch(
          "https://api.openai.com/v1/audio/transcriptions",
          {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}` },
            body: formData,
          },
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(
              "Invalid API key. Please check your OpenAI API key.",
            );
          }
          if (response.status === 429) {
            throw new Error(
              "Rate limit exceeded. Please wait a moment and try again.",
            );
          }
          const errorBody = await response.text();
          throw new Error(
            `OpenAI API error (${response.status}): ${errorBody}`,
          );
        }

        const data = await response.json();
        setTranscript({
          isBusy: false,
          text: data.text,
          chunks: [{ text: data.text, timestamp: [0, null] }],
        });

        // Report transcription cost
        if (durationMs && onTranscriptionUsage) {
          onTranscriptionUsage(model, durationMs / 1000);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        alert(`OpenAI transcription failed: ${message}`);
      } finally {
        setIsBusy(false);
      }
    },
    [apiKey, model, language, onTranscriptionUsage],
  );

  const transcriber = useMemo(
    () => ({
      onInputChange,
      isBusy,
      isModelLoading: false,
      progressItems: [],
      start: postRequest,
      output: transcript,
      model,
      setModel,
      multilingual,
      setMultilingual,
      quantized,
      setQuantized,
      subtask,
      setSubtask,
      language,
      setLanguage,
    }),
    [
      isBusy,
      postRequest,
      transcript,
      model,
      multilingual,
      quantized,
      subtask,
      language,
    ],
  );

  return transcriber;
}
