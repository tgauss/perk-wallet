-- participants: drop perk_uuid, enforce composite uniqueness
ALTER TABLE public.participants
  DROP COLUMN IF EXISTS perk_uuid;

ALTER TABLE public.participants
  ALTER COLUMN perk_participant_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_participants_program_pid
  ON public.participants (program_id, perk_participant_id);

CREATE INDEX IF NOT EXISTS ix_participants_perk_pid
  ON public.participants (perk_participant_id);

-- passes: swap to perk_participant_id, add resource fields and qr_payload
ALTER TABLE public.passes
  ADD COLUMN IF NOT EXISTS perk_participant_id BIGINT,
  ADD COLUMN IF NOT EXISTS resource_type TEXT NULL,
  ADD COLUMN IF NOT EXISTS resource_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS qr_payload TEXT NULL,
  ADD COLUMN IF NOT EXISTS qr_payload_version INT NOT NULL DEFAULT 1;

-- If column perk_uuid exists from earlier dev, drop it now
ALTER TABLE public.passes
  DROP COLUMN IF EXISTS perk_uuid;

-- Enforce one loyalty and one id pass per participant per program
CREATE UNIQUE INDEX IF NOT EXISTS ux_pass_loyalty_one
  ON public.passes (program_id, perk_participant_id, pass_kind)
  WHERE pass_kind = 'loyalty';

CREATE UNIQUE INDEX IF NOT EXISTS ux_pass_id_one
  ON public.passes (program_id, perk_participant_id, pass_kind)
  WHERE pass_kind = 'id';

-- install_links: add participant id and targeting
ALTER TABLE public.install_links
  ADD COLUMN IF NOT EXISTS perk_participant_id BIGINT,
  ADD COLUMN IF NOT EXISTS pass_kind TEXT NOT NULL DEFAULT 'loyalty',
  ADD COLUMN IF NOT EXISTS template_id UUID NULL,
  ADD COLUMN IF NOT EXISTS resource_type TEXT NULL,
  ADD COLUMN IF NOT EXISTS resource_id TEXT NULL;

-- Remove perk_uuid if present
ALTER TABLE public.install_links
  DROP COLUMN IF EXISTS perk_uuid;

-- Scope uniqueness: one link per scoped target
CREATE UNIQUE INDEX IF NOT EXISTS ux_install_links_scope
  ON public.install_links (
    program_id,
    perk_participant_id,
    pass_kind,
    COALESCE(resource_type,''),
    COALESCE(resource_id,'')
  );

-- programs.settings: add configurable default install group
-- This is JSONB. Only ensure the key exists on read. No DDL needed.