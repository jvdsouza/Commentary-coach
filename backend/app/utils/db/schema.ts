import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  status: text("status").notNull().default("uploaded"),
  sourceType: text("source_type"),
  sourceUrl: text("source_url"),
  videoDurationMs: integer("video_duration_ms"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const transcriptSegments = pgTable("transcript_segments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewId: uuid("review_id")
    .notNull()
    .references(() => reviews.id, { onDelete: "cascade" }),
  startMs: integer("start_ms").notNull(),
  endMs: integer("end_ms").notNull(),
  speaker: text("speaker"),
  text: text("text").notNull(),
  sentiment: text("sentiment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transcriptChunks = pgTable("transcript_chunks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewId: uuid("review_id")
    .notNull()
    .references(() => reviews.id, { onDelete: "cascade" }),
  chunkIndex: integer("chunk_index").notNull(),
  startMs: integer("start_ms").notNull(),
  endMs: integer("end_ms").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const coachingNotes = pgTable("coaching_notes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewId: uuid("review_id")
    .notNull()
    .references(() => reviews.id, { onDelete: "cascade" }),
  transcriptChunkId: uuid("transcript_chunk_id").references(
    () => transcriptChunks.id,
    { onDelete: "set null" }
  ),
  startMs: integer("start_ms").notNull(),
  endMs: integer("end_ms").notNull(),
  category: text("category").notNull(),
  severity: text("severity").notNull(),
  title: text("title").notNull(),
  observation: text("observation").notNull(),
  evidence: text("evidence").notNull(),
  whyItMatters: text("why_it_matters").notNull(),
  suggestion: text("suggestion").notNull(),
  speaker: text("speaker"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reviewSummaries = pgTable("review_summaries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewId: uuid("review_id")
    .notNull()
    .unique()
    .references(() => reviews.id, { onDelete: "cascade" }),
  overallSummary: text("overall_summary").notNull(),
  nextSessionFocus: text("next_session_focus").notNull(),
  clarityScore: integer("clarity_score"),
  pacingScore: integer("pacing_score"),
  storytellingScore: integer("storytelling_score"),
  hypeScore: integer("hype_score"),
  accessibilityScore: integer("accessibility_score"),
  synergyScore: integer("synergy_score"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reviewStrengths = pgTable("review_strengths", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewId: uuid("review_id")
    .notNull()
    .references(() => reviews.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
});

export const reviewImprovementAreas = pgTable("review_improvement_areas", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewId: uuid("review_id")
    .notNull()
    .references(() => reviews.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
});

export const reviewSpeakerFeedback = pgTable("review_speaker_feedback", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewId: uuid("review_id")
    .notNull()
    .references(() => reviews.id, { onDelete: "cascade" }),
  speaker: text("speaker").notNull(),
  topStrengths: text("top_strengths").notNull(),
  topImprovementAreas: text("top_improvement_areas").notNull(),
  nextSessionFocus: text("next_session_focus").notNull(),
});
