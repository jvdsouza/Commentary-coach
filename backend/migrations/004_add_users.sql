-- Up Migration

CREATE TABLE IF NOT EXISTS users (
  id                UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT      NOT NULL UNIQUE,
  access_code_hash  TEXT      NOT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Down Migration

DROP TABLE IF EXISTS users;
