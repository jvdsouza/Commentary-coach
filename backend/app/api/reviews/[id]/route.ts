import { eq } from "drizzle-orm";
import db from "@/app/utils/db";
import {
  reviews,
  reviewSummaries,
  reviewStrengths,
  reviewImprovementAreas,
  reviewSpeakerFeedback,
  transcriptChunks,
  coachingNotes,
} from "@/app/utils/db/schema";
import type {
  AnalysisData,
  ChunkAnalysisResult,
  Note,
  SynthesisResult,
} from "@commentary-coach/shared";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [review] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(eq(reviews.id, id));

  if (!review) {
    return Response.json({ error: "Review not found" }, { status: 404 });
  }

  const [summary] = await db
    .select({
      overallSummary: reviewSummaries.overallSummary,
      nextSessionFocus: reviewSummaries.nextSessionFocus,
    })
    .from(reviewSummaries)
    .where(eq(reviewSummaries.reviewId, id));

  if (!summary) {
    return Response.json(
      { error: "Analysis not complete for this review" },
      { status: 404 }
    );
  }

  const [strengths, areas, speakerRows, chunks, notes] = await Promise.all([
    db
      .select({ title: reviewStrengths.title, summary: reviewStrengths.summary })
      .from(reviewStrengths)
      .where(eq(reviewStrengths.reviewId, id)),
    db
      .select({ title: reviewImprovementAreas.title, summary: reviewImprovementAreas.summary })
      .from(reviewImprovementAreas)
      .where(eq(reviewImprovementAreas.reviewId, id)),
    db
      .select({
        speaker: reviewSpeakerFeedback.speaker,
        summary: reviewSpeakerFeedback.summary,
        topStrengths: reviewSpeakerFeedback.topStrengths,
        topImprovementAreas: reviewSpeakerFeedback.topImprovementAreas,
        nextSessionFocus: reviewSpeakerFeedback.nextSessionFocus,
      })
      .from(reviewSpeakerFeedback)
      .where(eq(reviewSpeakerFeedback.reviewId, id)),
    db
      .select({
        id: transcriptChunks.id,
        chunkIndex: transcriptChunks.chunkIndex,
        startMs: transcriptChunks.startMs,
        endMs: transcriptChunks.endMs,
      })
      .from(transcriptChunks)
      .where(eq(transcriptChunks.reviewId, id))
      .orderBy(transcriptChunks.chunkIndex),
    db
      .select({
        transcriptChunkId: coachingNotes.transcriptChunkId,
        startMs: coachingNotes.startMs,
        endMs: coachingNotes.endMs,
        category: coachingNotes.category,
        severity: coachingNotes.severity,
        title: coachingNotes.title,
        observation: coachingNotes.observation,
        evidence: coachingNotes.evidence,
        whyItMatters: coachingNotes.whyItMatters,
        suggestion: coachingNotes.suggestion,
        speaker: coachingNotes.speaker,
      })
      .from(coachingNotes)
      .where(eq(coachingNotes.reviewId, id))
      .orderBy(coachingNotes.startMs),
  ]);

  const notesByChunkId = new Map<string, Note[]>();
  for (const n of notes) {
    if (!n.transcriptChunkId) continue;
    const bucket = notesByChunkId.get(n.transcriptChunkId) ?? [];
    bucket.push({
      startMs: n.startMs,
      endMs: n.endMs,
      category: n.category as Note["category"],
      severity: n.severity as Note["severity"],
      title: n.title,
      observation: n.observation,
      evidence: n.evidence,
      whyItMatters: n.whyItMatters,
      suggestion: n.suggestion,
      speaker: n.speaker ?? undefined,
    });
    notesByChunkId.set(n.transcriptChunkId, bucket);
  }

  const chunkResults: ChunkAnalysisResult[] = chunks.map((c) => ({
    chunkStartMs: c.startMs,
    chunkEndMs: c.endMs,
    notes: notesByChunkId.get(c.id) ?? [],
    chunkSummary: {
      whatHappened: "",
      overallCommentaryQuality: "mixed",
      mainTakeaway: "",
    },
  }));

  const synthesis: SynthesisResult = {
    overallSummary: summary.overallSummary,
    nextSessionFocus: JSON.parse(summary.nextSessionFocus),
    topStrengths: strengths.map((s) => ({
      title: s.title,
      description: s.summary,
      evidence: "",
    })),
    topImprovementAreas: areas.map((a) => ({
      title: a.title,
      description: a.summary,
      suggestion: "",
    })),
    speakerFeedback: speakerRows.map((sf) => ({
      speaker: sf.speaker,
      summary: sf.summary,
      topStrengths: JSON.parse(sf.topStrengths),
      topImprovementAreas: JSON.parse(sf.topImprovementAreas),
      nextSessionFocus: JSON.parse(sf.nextSessionFocus),
    })),
  };

  return Response.json({ reviewId: id, chunkResults, synthesis } satisfies AnalysisData);
}
