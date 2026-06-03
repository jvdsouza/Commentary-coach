-- Up Migration

CREATE TABLE IF NOT EXISTS review_speaker_feedback (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id             UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  speaker               TEXT NOT NULL,
  top_strengths         TEXT NOT NULL,
  top_improvement_areas TEXT NOT NULL,
  next_session_focus    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS review_speaker_feedback_review_id ON review_speaker_feedback(review_id);

-- Down Migration

DROP TABLE IF EXISTS review_speaker_feedback;
