import type { TranscriptChunk } from "@/app/utils/AssemblyAI/types";
import { analyzeChunk, synthesizeResults } from "@/app/utils/analysis";
import { insertChunks, insertCoachingNotes, insertSummary, setReviewStatus } from "@/app/utils/db/reviews";

export async function POST(request: Request) {
  let reviewId: string | null;
  let chunks: TranscriptChunk[];

  try {
    const body = await request.json();
    reviewId = body.reviewId ?? null;
    chunks = body.chunks;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(chunks)) {
    return Response.json(
      { error: "Request body must include a chunks array of TranscriptChunk" },
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

  if (reviewId) {
    insertChunks(reviewId, chunks)
      .then((chunkIdMap) =>
        Promise.all(
          chunkResults.map((result, i) =>
            insertCoachingNotes(reviewId!, chunkIdMap.get(i) ?? null, result).catch(
              (e) => console.error(`[analysis] DB note insert failed for chunk ${i}:`, e)
            )
          )
        )
      )
      .catch((e) => console.error("[analysis] DB chunk insert failed:", e));
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

  if (reviewId) {
    insertSummary(reviewId, synthesis).catch(
      (e) => console.error("[analysis] DB summary insert failed:", e)
    );
    setReviewStatus(reviewId, "complete").catch(
      (e) => console.error("[analysis] DB status update failed:", e)
    );
  }

  return Response.json({ reviewId, chunkResults, synthesis });
}
