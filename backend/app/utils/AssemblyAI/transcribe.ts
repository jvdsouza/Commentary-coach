import type { TranscriptResponse } from "./types";
import { ASSEMBLYAI_BASE_URL } from "./index";

/**
 * Transcribes an audio file using AssemblyAI
 * @param audioInput - Either a Buffer or URL string to the audio file
 * @param headers - HTTP headers with authorization
 * @returns Transcript ID
 */
export async function transcribeAudio(
  audioInput: Buffer | string,
  headers: Record<string, string>
): Promise<string> {
  let uploadUrl: string;

  // If input is a Buffer, upload it first
  if (Buffer.isBuffer(audioInput)) {
    console.log("[AssemblyAI] Uploading audio buffer...");
    uploadUrl = await uploadAudioBuffer(audioInput, headers);
  } else {
    // Input is already a URL
    uploadUrl = audioInput;
  }

  // Submit transcription request
  const transcriptionResponse = await fetch(
    `${ASSEMBLYAI_BASE_URL}/v2/transcript`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        audio_url: uploadUrl,
        speech_models: ["universal-3-pro"],
        speaker_labels: true,
        sentiment_analysis: true,
      }),
    }
  );

  if (!transcriptionResponse.ok) {
    const errorBody = await transcriptionResponse.text();
    console.error("[AssemblyAI] Transcription request failed:", errorBody);
    throw new Error(
      `Failed to start transcription: ${transcriptionResponse.statusText} - ${errorBody}`
    );
  }

  const { id } = (await transcriptionResponse.json()) as TranscriptResponse;

  // Poll for completion
  const pollingEndpoint = `${ASSEMBLYAI_BASE_URL}/v2/transcript/${id}`;
  let transcript: TranscriptResponse;

  while (true) {
    const response = await fetch(pollingEndpoint, { headers });

    if (!response.ok) {
      throw new Error(`Failed to check transcription status: ${response.statusText}`);
    }

    transcript = (await response.json()) as TranscriptResponse;

    if (transcript.status === "completed") {
      console.log(`[AssemblyAI] Transcription completed: ${id}`);
      break;
    }

    if (transcript.status === "error") {
      throw new Error(
        `Transcription failed: ${transcript.error || "Unknown error"}`
      );
    }

    console.log(`[AssemblyAI] Transcription status: ${transcript.status}`);
    await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds
  }

  return id;
}

/**
 * Uploads an audio buffer to AssemblyAI
 * @param audioBuffer - Audio buffer to upload
 * @param headers - HTTP headers with authorization
 * @returns Upload URL
 */
async function uploadAudioBuffer(
  audioBuffer: Buffer,
  headers: Record<string, string>
): Promise<string> {
  const uploadResponse = await fetch(`${ASSEMBLYAI_BASE_URL}/v2/upload`, {
    method: "POST",
    headers: {
      Authorization: headers.Authorization || headers.authorization || "",
    },
    body: new Uint8Array(audioBuffer),
  });

  if (!uploadResponse.ok) {
    throw new Error(
      `Failed to upload audio: ${uploadResponse.statusText}`
    );
  }

  const { upload_url } = (await uploadResponse.json()) as { upload_url: string };
  console.log("[AssemblyAI] Audio buffer uploaded successfully");
  return upload_url;
}

/**
 * Retrieves transcript details
 * @param transcriptId - ID of the transcript
 * @param headers - HTTP headers with authorization
 * @returns Transcript details
 */
export async function getTranscript(
  transcriptId: string,
  headers: Record<string, string>
): Promise<TranscriptResponse> {
  const response = await fetch(
    `${ASSEMBLYAI_BASE_URL}/v2/transcript/${transcriptId}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`Failed to retrieve transcript: ${response.statusText}`);
  }

  return (await response.json()) as TranscriptResponse;
}
