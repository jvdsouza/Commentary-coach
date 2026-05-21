import type { TranscriptChunk } from "@/app/utils/AssemblyAI/types";
import { analyzeChunk, synthesizeResults } from "@/app/utils/analysis";

export async function POST(request: Request) {
  let chunks: TranscriptChunk[];

  try {
    chunks = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(chunks)) {
    return Response.json(
      { error: "Request body must be an array of TranscriptChunk" },
      { status: 400 }
    );
  }

  let chunkResults;
  try {
    const total = chunks.length;
    let completed = 0;
    chunkResults = await Promise.all(
      chunks.map(async (chunk, i) => {
        const result = await analyzeChunk(chunk);
        completed++;
        console.log(`[analysis] Chunk ${completed}/${total} analysed (index ${i})`);
        return result;
      })
    );
  } catch (error) {
    console.error("[analysis] Chunk analysis failed:", error);
    return Response.json(
      {
        error: "Chunk analysis failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }

  let synthesis;
  try {
    console.log("[analysis] Starting synthesis...");
    synthesis = await synthesizeResults(chunkResults);
    console.log("[analysis] Synthesis complete");
  } catch (error) {
    console.error("[analysis] Synthesis failed:", error);
    return Response.json(
      {
        error: "Synthesis failed",
        message: error instanceof Error ? error.message : "Unknown error",
        chunkResults,
      },
      { status: 500 }
    );
  }

  return Response.json({ chunkResults, synthesis });
}
