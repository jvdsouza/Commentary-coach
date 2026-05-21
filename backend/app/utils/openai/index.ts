import OpenAI from "openai";
import type { ResponseCreateParamsNonStreaming } from "openai/resources/responses/responses";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export async function callResponsesAPI<T>(
  options: ResponseCreateParamsNonStreaming
): Promise<T> {
  const response = await getClient().responses.parse(options);

  if (response.output_parsed === null) {
    throw new Error("Responses API returned no parsed output");
  }

  return response.output_parsed as T;
}
