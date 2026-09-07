-- Add photo_url to players
ALTER TABLE players ADD COLUMN IF NOT EXISTS photo_url text;

-- Branding settings table (single-row key-value)
CREATE TABLE IF NOT EXISTS branding_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  logo_url text,
  primary_color text DEFAULT '#c9a227',
  secondary_color text DEFAULT '#131318',
  text_color text DEFAULT '#e2e8f0',
  updated_at timestamptz DEFAULT now()
);

INSERT INTO branding_settings (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;

ALTER TABLE branding_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_branding" ON branding_settings;
CREATE POLICY "anon_select_branding" ON branding_settings FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_update_branding" ON branding_settings;
CREATE POLICY "anon_update_branding" ON branding_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Storage bucket for player photos and logo
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: allow public read, authenticated write
DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
CREATE POLICY "media_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_anon_write" ON storage.objects;
CREATE POLICY "media_anon_write" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "media_anon_update" ON storage.objects;
CREATE POLICY "media_anon_update" ON storage.objects FOR UPDATE
  TO anon, authenticated USING (bucket_id = 'media') WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "media_anon_delete" ON storage.objects;
CREATE POLICY "media_anon_delete" ON storage.objects FOR DELETE
  TO anon, authenticated USING (bucket_id = 'media');
