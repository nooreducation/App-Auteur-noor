-- SQL for Supabase to create the conversion brain table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS conversion_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    signature TEXT UNIQUE NOT NULL, -- The "DNA" of the JSON structure or mAuthor addonId
    addon_id TEXT, -- Human readable addon name (ex: 'gamememo')
    html_template TEXT NOT NULL, -- The HTML/CSS template with placeholders
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    created_by TEXT -- Optional: to track who taught this
);

-- Enable RLS (Row Level Security) if needed
-- For now, let's keep it open for the pilot phase
ALTER TABLE conversion_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access" ON conversion_rules FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update Access" ON conversion_rules FOR ALL USING (true);
