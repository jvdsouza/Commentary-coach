-- Up Migration

ALTER TABLE review_speaker_feedback ADD COLUMN summary TEXT;

UPDATE review_speaker_feedback SET summary = '' WHERE summary IS NULL;

ALTER TABLE review_speaker_feedback ALTER COLUMN summary SET NOT NULL;

-- Down Migration

ALTER TABLE review_speaker_feedback DROP COLUMN summary;
