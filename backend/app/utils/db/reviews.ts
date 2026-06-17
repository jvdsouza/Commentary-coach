import { eq } from "drizzle-orm";
import db from "@/app/utils/db";
import {
  reviews,
  transcriptSegments,
  transcriptChunks,
  coachingNotes,
  reviewSummaries,
  reviewStrengths,
  reviewImprovementAreas,
  reviewSpeakerFeedback,
} from "./schema";
import type {
  TranscriptSegment,
  TranscriptChunk,
  ChunkAnalysisResult,
  SynthesisResult,
} from "@commentary-coach/shared";

export async function createReview(title: string): Promise<string> {
  const [row] = await db.insert(reviews).values({ title }).returning({ id: reviews.id });
  return row.id;
}

export async function setReviewStatus(reviewId: string, status: string): Promise<void> {
  await db.update(reviews).set({ status }).where(eq(reviews.id, reviewId));
}

export async function insertSegments(
  reviewId: string,
  segments: TranscriptSegment[]
): Promise<void> {
  if (segments.length === 0) return;
  await db.insert(transcriptSegments).values(
    segments.map((s) => ({
      reviewId,
      startMs: s.startMs,
      endMs: s.endMs,
      speaker: s.speaker ?? null,
      text: s.text,
      sentiment: s.sentiment ?? null,
    }))
  );
}

export async function insertChunks(
  reviewId: string,
  chunks: TranscriptChunk[]
): Promise<Map<number, string>> {
  if (chunks.length === 0) return new Map();
  const rows = await db
    .insert(transcriptChunks)
    .values(
      chunks.map((c, i) => ({
        reviewId,
        chunkIndex: i,
        startMs: c.startMs,
        endMs: c.endMs,
      }))
    )
    .returning({ id: transcriptChunks.id, chunkIndex: transcriptChunks.chunkIndex });
  return new Map(rows.map((r) => [r.chunkIndex, r.id]));
}

export async function insertCoachingNotes(
  reviewId: string,
  chunkId: string | null,
  result: ChunkAnalysisResult
): Promise<void> {
  if (result.notes.length === 0) return;
  await db.insert(coachingNotes).values(
    result.notes.map((n) => ({
      reviewId,
      transcriptChunkId: chunkId,
      startMs: n.startMs,
      endMs: n.endMs,
      category: n.category,
      severity: n.severity,
      title: n.title,
      observation: n.observation,
      evidence: n.evidence,
      whyItMatters: n.whyItMatters,
      suggestion: n.suggestion,
      speaker: n.speaker ?? null,
    }))
  );
}

export async function insertSummary(
  reviewId: string,
  synthesis: SynthesisResult
): Promise<void> {
  await db.insert(reviewSummaries).values({
    reviewId,
    overallSummary: synthesis.overallSummary,
    nextSessionFocus: JSON.stringify(synthesis.nextSessionFocus),
  });

  if (synthesis.topStrengths.length > 0) {
    await db.insert(reviewStrengths).values(
      synthesis.topStrengths.map((s) => ({
        reviewId,
        title: s.title,
        summary: s.description,
      }))
    );
  }

  if (synthesis.topImprovementAreas.length > 0) {
    await db.insert(reviewImprovementAreas).values(
      synthesis.topImprovementAreas.map((a) => ({
        reviewId,
        title: a.title,
        summary: a.description,
      }))
    );
  }

  if (synthesis.speakerFeedback.length > 0) {
    await db.insert(reviewSpeakerFeedback).values(
      synthesis.speakerFeedback.map((sf) => ({
        reviewId,
        speaker: sf.speaker,
        summary: sf.summary,
        topStrengths: JSON.stringify(sf.topStrengths),
        topImprovementAreas: JSON.stringify(sf.topImprovementAreas),
        nextSessionFocus: JSON.stringify(sf.nextSessionFocus),
      }))
    );
  }
}
