import OpenAI, { APIError } from "openai";
import type { ResponseCreateParamsNonStreaming } from "openai/resources/responses/responses";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 520, 521, 522, 523, 524]);
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30_000;

function retryDelayMs(error: APIError, attempt: number): number {
  const retryAfterHeader = error.headers?.get("retry-after");
  if (retryAfterHeader) {
    const seconds = Number(retryAfterHeader);
    if (!Number.isNaN(seconds)) return seconds * 1000;
  }
  return Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
}

export async function callResponsesAPI<T>(
  options: ResponseCreateParamsNonStreaming
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await getClient().responses.parse(options);

      if (response.output_parsed === null) {
        throw new Error("Responses API returned no parsed output");
      }

      return response.output_parsed as T;
    } catch (error) {
      const retryable = error instanceof APIError && RETRYABLE_STATUS_CODES.has(error.status ?? 0);
      if (!retryable || attempt >= MAX_RETRIES) {
        throw error;
      }

      const delay = retryDelayMs(error, attempt);
      console.warn(
        `[openai] Retryable error (status ${error.status}), retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
