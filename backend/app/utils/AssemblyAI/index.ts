/**  
 * Takes an audio file as input and uses AssemblyAI's LLM gateway to annotate and provide taxonomies of commentary
 * Supported Audio File Types
 * The following audio formats are accepted : .3ga .8svx, .aac, .ac3, .aif, .aiff, .alac, .amr, .ape, .au, .dss, .flac, .flv, .m4a, .m4b, .m4p, .m4r, .mp3, .mpga, .ogg, .oga, .mogg, .opus, .qcp, .tta, .voc, .wav, .wma, .wv
 * Returns a JSON object with the following structure:
 * {
 *   [timestamp+Commentator]: {
 *     "commentaryType": "play-by-play" | "color" | "analysis" | "other",
 *     "sentiment": "positive" | "neutral" | "negative",
 *     "topics": ["topic1", "topic2", ...]
 *     "pacing": "fast" | "medium" | "slow"
 *     "accessibility": "accessible" | "inaccessible"
 *     "narrative": "narrative" | "non-narrative"
 *     "habits": ["habit1", "habit2", ...]
 *     "clarity": "clear" | "unclear"
 *     "strengths": ["reason1", "reason2"]
 *   },
 *   ...
 * } 
 * where timestamp is the timestamp as a string and commentator is the annotation of the
 * person as a string, ie Person1, as AssembleAI provides per speaker diarization.
 * accessibility is determined by the use of jargon, technical terms, and complex language that may be difficult for a general audience to understand.
 * narrative is determined by the presence of storytelling elements, such as storytelling of players and identity, stakes clarity, and emotional language that create a compelling and engaging narrative for the audience.
 * habits consist of: "repeated phrases", "filler words", "pauses in sentences", "interruptions", "tangent drift"
 * strenghts consist of reasons the commentary was a positive experience. For example strong delivery of a hype moment, clear explanation, educative moment, etc.
 */

interface CommentaryAnalysis {
  [key: string]: {
    commentaryType: "play-by-play" | "color" | "analysis" | "other";
    sentiment: "positive" | "neutral" | "negative";
    topics: string[];
    pacing: "fast" | "medium" | "slow";
    accessibility: "accessible" | "inaccessible";
    narrative: "narrative" | "non-narrative";
    habits: string[];
    clarity: "clear" | "unclear";
    strengths: string[];
  };
}

interface TranscriptResponse {
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
}

interface LLMGatewayResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const ASSEMBLYAI_BASE_URL = "https://api.assemblyai.com";
const LLM_GATEWAY_URL = "https://llm-gateway.assemblyai.com/v1/chat/completions";

/**
 * Analyzes an audio file's commentary using AssemblyAI's transcription and LLM Gateway
 * @param audioInput - Either a Buffer (from extractAudio) or a URL string to the audio file
 * @param transcriptId - Optional: use existing transcript ID instead of uploading new audio
 * @returns CommentaryAnalysis object with detailed breakdown of commentary characteristics
 * @throws Error if transcription fails or LLM processing fails
 */
export async function analyzeCommentary(
  audioInput?: Buffer | string,
  transcriptId?: string
): Promise<CommentaryAnalysis> {
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error("ASSEMBLYAI_API_KEY environment variable is not set");
  }

  const headers = {
    authorization: ASSEMBLYAI_API_KEY,
    "Content-Type": "application/json",
  };

  let finalTranscriptId = transcriptId;

  // Step 1: Transcribe audio if transcriptId not provided
  if (!finalTranscriptId && audioInput) {
    console.log("[AssemblyAI] Starting transcription...");
    finalTranscriptId = await transcribeAudio(audioInput, headers);
  }

  if (!finalTranscriptId) {
    throw new Error("Either transcriptId or audioInput must be provided");
  }

  // Step 2: Get the transcript
  console.log(`[AssemblyAI] Retrieving transcript: ${finalTranscriptId}`);
  const transcript = await getTranscript(finalTranscriptId, headers);

  if (!transcript.text) {
    throw new Error("No transcript text available");
  }

  // Step 3: Send to LLM Gateway for analysis
  console.log("[AssemblyAI] Analyzing commentary with LLM Gateway...");
  const analysis = await analyzeWithLLM(
    finalTranscriptId,
    transcript,
    headers
  );

  return analysis;
}

/**
 * Transcribes an audio file using AssemblyAI
 * @param audioInput - Either a Buffer or URL string to the audio file
 * @param headers - HTTP headers with authorization
 * @returns Transcript ID
 */
async function transcribeAudio(
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
      body: JSON.stringify({ audio_url: uploadUrl }),
    }
  );

  if (!transcriptionResponse.ok) {
    throw new Error(
      `Failed to start transcription: ${transcriptionResponse.statusText}`
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
      authorization: headers.authorization,
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
async function getTranscript(
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

/**
 * Analyzes transcript using LLM Gateway
 * @param transcriptId - ID of the transcript
 * @param transcript - Transcript details
 * @param headers - HTTP headers with authorization
 * @returns Analyzed commentary structure
 */
async function analyzeWithLLM(
  transcriptId: string,
  transcript: TranscriptResponse,
  headers: Record<string, string>
): Promise<CommentaryAnalysis> {
  // Build a speaker-labeled transcript for better context
  let formattedTranscript = transcript.text || "";
  
  if (transcript.utterances && transcript.utterances.length > 0) {
    formattedTranscript = transcript.utterances
      .map((utterance) => `[${utterance.speaker}]: ${utterance.text}`)
      .join("\n");
  }

  const prompt = `Analyze the following sports commentary transcript and provide a detailed breakdown using the specified JSON structure.

For each speaker segment, use the key format: "startTimestamp-endTimestamp-speaker" (e.g., "0:15-0:45-Person1")

For each segment, extract and categorize:
- commentaryType: Classify as "play-by-play" (describing action in real-time), "color" (adding context/humor), "analysis" (explaining strategy/mechanics), or "other"
- sentiment: Overall emotional tone - "positive" (enthusiastic/uplifting), "negative" (critical/disappointed), or "neutral" (factual)
- topics: List of main subjects covered (e.g., player performance, team strategy, statistics)
- pacing: Speech pace - "fast" (high energy), "medium" (normal), or "slow" (deliberate)
- accessibility: "accessible" if clear to general audience, "inaccessible" if uses excessive jargon/technical terms
- narrative: "narrative" if includes storytelling elements (player stories, emotional arcs), "non-narrative" if purely informational
- habits: Include any of: "repeated phrases", "filler words", "pauses in sentences", "interruptions", "tangent drift"
- clarity: "clear" if easy to understand, "unclear" if confusing or poorly explained
- strengths: Positive aspects (e.g., "strong hype delivery", "clear explanation", "educational moment")

Return ONLY valid JSON with the specified key format.

{{ transcript }}`;

  const llmData = {
    model: "claude-sonnet-4-6",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    transcript_id: transcriptId,
    max_tokens: 4000,
  };

  const llmResponse = await fetch(LLM_GATEWAY_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(llmData),
  });

  if (!llmResponse.ok) {
    throw new Error(
      `LLM Gateway request failed: ${llmResponse.statusText}`
    );
  }

  const result = (await llmResponse.json()) as LLMGatewayResponse;
  const content = result.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No response content from LLM Gateway");
  }

  // Parse JSON response
  try {
    // Extract JSON from response (in case there's surrounding text)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in LLM response");
    }

    const analysis = JSON.parse(jsonMatch[0]) as CommentaryAnalysis;
    console.log("[AssemblyAI] Analysis complete");
    return analysis;
  } catch (error) {
    console.error(
      "[AssemblyAI] Failed to parse LLM response:",
      content
    );
    throw new Error(
      `Failed to parse analysis response: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Utility function to check transcript status
 * @param transcriptId - ID of the transcript
 * @returns Transcript status and details
 */
export async function getTranscriptStatus(transcriptId: string): Promise<TranscriptResponse> {
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error("ASSEMBLYAI_API_KEY environment variable is not set");
  }

  const headers = {
    authorization: ASSEMBLYAI_API_KEY,
  };

  return getTranscript(transcriptId, headers);
}