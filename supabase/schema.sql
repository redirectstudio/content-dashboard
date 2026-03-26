-- ─────────────────────────────────────────────────────────────
-- Content Dashboard — Supabase Schema
-- Run this in your Supabase SQL Editor (supabase.com → SQL Editor)
-- ─────────────────────────────────────────────────────────────

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- TABLE: content_analytics
-- Stores per-post metrics for every platform and avatar
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_analytics (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id          TEXT NOT NULL,
  platform         TEXT NOT NULL CHECK (platform IN ('instagram','facebook','threads','youtube','tiktok')),
  avatar           TEXT NOT NULL CHECK (avatar IN ('avatar_1','avatar_2','avatar_3')),
  title            TEXT,
  caption          TEXT,
  thumbnail_url    TEXT,
  video_url        TEXT,
  post_url         TEXT,
  published_at     TIMESTAMPTZ,
  views            BIGINT DEFAULT 0,
  likes            BIGINT DEFAULT 0,
  comments         BIGINT DEFAULT 0,
  shares           BIGINT DEFAULT 0,
  saves            BIGINT DEFAULT 0,
  reach            BIGINT DEFAULT 0,
  impressions      BIGINT DEFAULT 0,
  watch_time_mins  NUMERIC(12,2) DEFAULT 0,
  engagement_rate  NUMERIC(8,4) DEFAULT 0,
  synced_at        TIMESTAMPTZ DEFAULT NOW(),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (post_id, platform)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_ca_platform      ON content_analytics (platform);
CREATE INDEX IF NOT EXISTS idx_ca_avatar        ON content_analytics (avatar);
CREATE INDEX IF NOT EXISTS idx_ca_published_at  ON content_analytics (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_ca_platform_avatar ON content_analytics (platform, avatar);
CREATE INDEX IF NOT EXISTS idx_ca_views         ON content_analytics (views DESC);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON content_analytics;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON content_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────────────────────
-- TABLE: account_snapshots
-- Daily follower counts per account — used for Followers KPI card
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS account_snapshots (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform        TEXT NOT NULL,
  avatar          TEXT NOT NULL,
  follower_count  BIGINT DEFAULT 0,
  following_count BIGINT DEFAULT 0,
  post_count      BIGINT DEFAULT 0,
  snapshotted_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Unique index on date (cast expression can't go in table-level UNIQUE constraint)
CREATE UNIQUE INDEX IF NOT EXISTS idx_as_unique_daily
  ON account_snapshots (platform, avatar, (snapshotted_at::date));

CREATE INDEX IF NOT EXISTS idx_as_platform_avatar ON account_snapshots (platform, avatar);
CREATE INDEX IF NOT EXISTS idx_as_snapshotted_at  ON account_snapshots (snapshotted_at DESC);

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- Restrict direct access — only service role can write
-- ─────────────────────────────────────────────────────────────
ALTER TABLE content_analytics   ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_snapshots   ENABLE ROW LEVEL SECURITY;

-- Allow anon reads for the dashboard frontend
CREATE POLICY "Allow anon reads on content_analytics"
  ON content_analytics FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon reads on account_snapshots"
  ON account_snapshots FOR SELECT TO anon USING (true);

-- Only service role can insert/update (used by the sync API route)
CREATE POLICY "Service role full access on content_analytics"
  ON content_analytics FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access on account_snapshots"
  ON account_snapshots FOR ALL TO service_role USING (true);
