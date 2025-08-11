-- Add program branding configuration to programs table
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS branding_fonts JSONB DEFAULT '{"header_font": "Inter", "body_font": "Inter"}',
ADD COLUMN IF NOT EXISTS branding_colors JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS branding_assets JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS branding_borders JSONB DEFAULT '{"button_border_radius": "Medium", "input_border_radius": "Medium", "tiles_border_radius": "Medium", "cards_border_radius": "Medium"}';

-- Update programs table to include description
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create webhook_events table for proper event tracking with program context
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  perk_program_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  event_id TEXT NOT NULL, -- idempotency key (SHA256 hash)
  participant_id INTEGER, -- Perk participant ID
  participant_email TEXT,
  participant_uuid UUID, -- Our internal participant UUID
  event_data JSONB NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure idempotency per program
  UNIQUE(program_id, event_id)
);

-- Create indexes for webhook_events table
CREATE INDEX IF NOT EXISTS idx_webhook_events_program ON webhook_events(program_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_perk_program ON webhook_events(perk_program_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_participant ON webhook_events(participant_id);

-- Add program_id indexes to existing tables for better performance
CREATE INDEX IF NOT EXISTS idx_participants_program_id ON participants(program_id);
CREATE INDEX IF NOT EXISTS idx_passes_program_id ON passes(program_id);
CREATE INDEX IF NOT EXISTS idx_templates_program_id ON templates(program_id);

-- Update participants table to track latest event info
ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS last_webhook_event_type TEXT,
ADD COLUMN IF NOT EXISTS last_webhook_event_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS webhook_event_count INTEGER DEFAULT 0;

-- Add constraint to ensure participants belong to correct program
-- This prevents cross-program data leakage
CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_program_perk_id 
ON participants(program_id, perk_participant_id) 
WHERE perk_participant_id IS NOT NULL;

-- Add constraint to ensure passes belong to correct program through participants
-- Add program_id directly to passes for faster queries
ALTER TABLE passes 
ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE CASCADE;

-- Populate program_id in passes from participants (one-time migration)
UPDATE passes 
SET program_id = p.program_id 
FROM participants p 
WHERE passes.perk_uuid = p.perk_uuid AND passes.program_id IS NULL;

-- Add index for passes by program
CREATE INDEX IF NOT EXISTS idx_passes_program_id ON passes(program_id);

-- Function to get program stats
CREATE OR REPLACE FUNCTION get_program_stats(prog_id UUID)
RETURNS TABLE(
  participant_count BIGINT,
  total_webhook_events BIGINT,
  last_activity TIMESTAMPTZ,
  event_type_counts JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM participants WHERE program_id = prog_id) as participant_count,
    (SELECT COUNT(*) FROM webhook_events WHERE program_id = prog_id) as total_webhook_events,
    (SELECT MAX(created_at) FROM webhook_events WHERE program_id = prog_id) as last_activity,
    (SELECT COALESCE(json_object_agg(event_type, event_count), '{}')::jsonb 
     FROM (
       SELECT event_type, COUNT(*) as event_count 
       FROM webhook_events 
       WHERE program_id = prog_id 
       GROUP BY event_type
     ) event_counts) as event_type_counts;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE webhook_events IS 'Tracks all webhook events with full program context and idempotency';
COMMENT ON COLUMN programs.branding_fonts IS 'Font configuration: header_font, body_font';
COMMENT ON COLUMN programs.branding_colors IS 'Color scheme: brand_color, brand_text_color, secondary_color, etc.';
COMMENT ON COLUMN programs.branding_assets IS 'Asset URLs: logo_url, favicon_url, hero_background_image_url, etc.';
COMMENT ON COLUMN programs.branding_borders IS 'Border radius settings for UI elements';