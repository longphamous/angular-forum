-- Migration: Add best answer support to forum threads and posts
-- Run this against the aniverse_base database as aniverse_app

ALTER TABLE forum_posts
    ADD COLUMN IF NOT EXISTS is_best_answer BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE forum_threads
    ADD COLUMN IF NOT EXISTS best_answer_post_id UUID REFERENCES forum_posts(id) ON DELETE SET NULL;
