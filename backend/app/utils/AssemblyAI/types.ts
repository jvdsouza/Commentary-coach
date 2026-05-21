export type { TranscriptChunk, TranscriptSegment } from "@commentary-coach/shared";

export interface TranscriptResponse {
  id: string;
  status: "queued" | "processing" | "completed" | "error";
  error?: string;
  text?: string;
  utterances?: Array<{
    start: number;
    end: number;
    speaker: string;
    text: string;
  }>;
  sentiment_analysis_results?: Array<{
    text: string;
    start: number;
    end: number;
    sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
    confidence: number;
    speaker: string | null;
  }>;
}

export interface LLMGatewayResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}
