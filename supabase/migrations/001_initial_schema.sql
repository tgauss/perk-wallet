-- Programs table
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  api_key TEXT NOT NULL,
  webhook_secret TEXT NOT NULL,
  apple_pass_type_id TEXT,
  google_wallet_class_id TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Templates table for pass designs
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  pass_type TEXT NOT NULL CHECK (pass_type IN ('loyalty', 'rewards')),
  version INTEGER NOT NULL DEFAULT 1,
  apple_template JSONB DEFAULT '{}',
  google_template JSONB DEFAULT '{}',
  fields_mapping JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(program_id, pass_type, version)
);

-- Participants table
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perk_uuid TEXT UNIQUE NOT NULL,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  perk_participant_id TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  tier TEXT,
  status TEXT,
  profile_attributes JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  INDEX idx_participants_email (email),
  INDEX idx_participants_program_email (program_id, email)
);

-- Passes table
CREATE TABLE passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  pass_type TEXT NOT NULL CHECK (pass_type IN ('loyalty', 'rewards')),
  apple_serial_number TEXT UNIQUE,
  apple_auth_token TEXT,
  google_object_id TEXT UNIQUE,
  pass_data JSONB DEFAULT '{}',
  data_hash TEXT,
  version INTEGER DEFAULT 1,
  last_updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  INDEX idx_passes_participant (participant_id),
  INDEX idx_passes_apple_serial (apple_serial_number),
  INDEX idx_passes_google_object (google_object_id)
);

-- Jobs queue table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payload JSONB DEFAULT '{}',
  result JSONB,
  error TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  INDEX idx_jobs_status_scheduled (status, scheduled_at),
  INDEX idx_jobs_type_status (type, status)
);

-- Webhook events table for idempotency
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  INDEX idx_webhook_events_event_id (event_id)
);

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();