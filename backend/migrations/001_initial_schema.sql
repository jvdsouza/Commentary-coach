-- Up Migration

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS reviews (
  id                UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT      NOT NULL,
  status            TEXT      NOT NULL DEFAULT 'uploaded',
  source_type       TEXT,
  source_url        TEXT,
  video_duration_ms INTEGER,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS transcript_segments (
  id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id  UUID      NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  start_ms   INTEGER   NOT NULL,
  end_ms     INTEGER   NOT NULL,
  speaker    TEXT,
  text       TEXT      NOT NULL,
  sentiment  TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS transcript_segments_review_id ON transcript_segments(review_id);

CREATE TABLE IF NOT EXISTS transcript_chunks (
  id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   UUID      NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  chunk_index INTEGER   NOT NULL,
  start_ms    INTEGER   NOT NULL,
  end_ms      INTEGER   NOT NULL,
  status      TEXT      NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS transcript_chunks_review_id ON transcript_chunks(review_id);

CREATE TABLE IF NOT EXISTS coaching_notes (
  id                  UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id           UUID      NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  transcript_chunk_id UUID      REFERENCES transcript_chunks(id) ON DELETE SET NULL,
  start_ms            INTEGER   NOT NULL,
  end_ms              INTEGER   NOT NULL,
  category            TEXT      NOT NULL,
  severity            TEXT      NOT NULL,
  title               TEXT      NOT NULL,
  observation         TEXT      NOT NULL,
  evidence            TEXT      NOT NULL,
  why_it_matters      TEXT      NOT NULL,
  suggestion          TEXT      NOT NULL,
  speaker             TEXT,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS coaching_notes_review_id           ON coaching_notes(review_id);
CREATE INDEX IF NOT EXISTS coaching_notes_transcript_chunk_id ON coaching_notes(transcript_chunk_id);

CREATE TABLE IF NOT EXISTS review_summaries (
  id                  UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id           UUID      NOT NULL UNIQUE REFERENCES reviews(id) ON DELETE CASCADE,
  overall_summary     TEXT      NOT NULL,
  next_session_focus  TEXT      NOT NULL,
  clarity_score       INTEGER,
  pacing_score        INTEGER,
  storytelling_score  INTEGER,
  hype_score          INTEGER,
  accessibility_score INTEGER,
  synergy_score       INTEGER,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS review_strengths (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  title     TEXT NOT NULL,
  summary   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS review_strengths_review_id ON review_strengths(review_id);

CREATE TABLE IF NOT EXISTS review_improvement_areas (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  title     TEXT NOT NULL,
  summary   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS review_improvement_areas_review_id ON review_improvement_areas(review_id);

-- Down Migration

DROP TABLE IF EXISTS review_improvement_areas;
DROP TABLE IF EXISTS review_strengths;
DROP TABLE IF EXISTS review_summaries;
DROP TABLE IF EXISTS coaching_notes;
DROP TABLE IF EXISTS transcript_chunks;
DROP TABLE IF EXISTS transcript_segments;
DROP TRIGGER IF EXISTS reviews_updated_at ON reviews;
DROP TABLE IF EXISTS reviews;
DROP FUNCTION IF EXISTS set_updated_at;
