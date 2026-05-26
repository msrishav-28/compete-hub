-- CompeteHub schema for Supabase Postgres.
-- Run once in the Supabase SQL editor on a fresh project.
-- Idempotent: safe to re-run.

-- =========================================================
-- USERS
-- =========================================================
CREATE TABLE IF NOT EXISTS users (
    user_id                 TEXT PRIMARY KEY,
    name                    TEXT,
    email                   TEXT UNIQUE,
    college                 TEXT,
    year                    INT  CHECK (year IS NULL OR year BETWEEN 1 AND 6),
    specializations         TEXT[]  NOT NULL DEFAULT '{}',
    skill_levels            JSONB   NOT NULL DEFAULT '{}'::jsonb,
    linked_profiles         JSONB   NOT NULL DEFAULT '{}'::jsonb,
    difficulty_preference   TEXT    NOT NULL DEFAULT 'intermediate'
                            CHECK (difficulty_preference IN ('beginner','intermediate','advanced','expert')),
    time_available_weekly   INT     NOT NULL DEFAULT 10 CHECK (time_available_weekly BETWEEN 0 AND 168),
    preferred_categories    TEXT[]  NOT NULL DEFAULT '{}',
    goals                   TEXT[]  NOT NULL DEFAULT '{}',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- COMPETITIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS competitions (
    id                      TEXT PRIMARY KEY,
    title                   TEXT NOT NULL,
    description             TEXT,
    category                TEXT,
    subcategory             TEXT,
    platform                TEXT,
    company                 TEXT,
    start_date              TIMESTAMPTZ,
    end_date                TIMESTAMPTZ,
    registration_deadline   TIMESTAMPTZ,
    duration_hours          NUMERIC,
    time_commitment         TEXT  CHECK (time_commitment IS NULL OR time_commitment IN ('low','medium','high')),
    difficulty              TEXT  CHECK (difficulty IS NULL OR difficulty IN ('beginner','intermediate','advanced','expert','mixed')),
    skills_required         TEXT[]  NOT NULL DEFAULT '{}',
    team_size               TEXT,
    location                TEXT,
    prize                   JSONB,
    link                    TEXT,
    registration_link       TEXT,
    leaderboard_link        TEXT,
    tags                    TEXT[]  NOT NULL DEFAULT '{}',
    recruitment_potential   BOOLEAN NOT NULL DEFAULT FALSE,
    companies_recruiting    TEXT[]  NOT NULL DEFAULT '{}',
    portfolio_value         INT     NOT NULL DEFAULT 50 CHECK (portfolio_value BETWEEN 0 AND 100),
    source                  TEXT,
    last_updated            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    scraped_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comp_category    ON competitions (category);
CREATE INDEX IF NOT EXISTS idx_comp_difficulty  ON competitions (difficulty);
CREATE INDEX IF NOT EXISTS idx_comp_platform    ON competitions (platform);
CREATE INDEX IF NOT EXISTS idx_comp_start_date  ON competitions (start_date);
CREATE INDEX IF NOT EXISTS idx_comp_recruitment ON competitions (recruitment_potential)
    WHERE recruitment_potential = TRUE;

-- Full-text search index over title + description (replaces regex search)
CREATE INDEX IF NOT EXISTS idx_comp_search
    ON competitions
    USING GIN (to_tsvector('english', COALESCE(title,'') || ' ' || COALESCE(description,'')));

-- =========================================================
-- SAVED COMPETITIONS (bookmarks)
--   Composite PK gives us atomic save/unsave with zero
--   read-then-write races: INSERT ... ON CONFLICT DO NOTHING
--   for save, DELETE for unsave.
-- =========================================================
CREATE TABLE IF NOT EXISTS saved_competitions (
    user_id         TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    competition_id  TEXT NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    saved_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, competition_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_competitions (user_id);

-- =========================================================
-- COMPETITION ENTRIES (registered / participated)
-- =========================================================
CREATE TABLE IF NOT EXISTS competition_entries (
    id              BIGSERIAL PRIMARY KEY,
    user_id         TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    competition_id  TEXT NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'registered'
                    CHECK (status IN ('registered','participated','withdrawn')),
    entered_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, competition_id, status)
);
CREATE INDEX IF NOT EXISTS idx_entries_user ON competition_entries (user_id);

-- =========================================================
-- COMPETITION WINS (placements)
-- =========================================================
CREATE TABLE IF NOT EXISTS competition_wins (
    id              BIGSERIAL PRIMARY KEY,
    user_id         TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    competition_id  TEXT NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    placement       INT  NOT NULL CHECK (placement BETWEEN 1 AND 1000),
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wins_user ON competition_wins (user_id);

-- =========================================================
-- FETCHER METADATA
--   Row per source. Used for freshness checks and to coordinate
--   concurrent refreshes via advisory locks (keyed by hashtext).
-- =========================================================
CREATE TABLE IF NOT EXISTS fetcher_metadata (
    source              TEXT PRIMARY KEY,
    last_updated        TIMESTAMPTZ,
    competition_count   INT NOT NULL DEFAULT 0,
    last_status         TEXT
);

-- =========================================================
-- updated_at trigger on users
-- =========================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
