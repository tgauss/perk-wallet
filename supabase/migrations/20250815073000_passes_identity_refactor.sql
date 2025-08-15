-- Refactor passes table to use composite participant key instead of perk_uuid
-- This migration aligns passes with the new participants composite primary key

-- 1) Add new column for participant id
ALTER TABLE public.passes
  ADD COLUMN IF NOT EXISTS perk_participant_id bigint;

-- 2) Make it required (no backfill needed; env is pre-launch)
ALTER TABLE public.passes
  ALTER COLUMN perk_participant_id SET NOT NULL;

-- 3) Drop old identity column
ALTER TABLE public.passes
  DROP COLUMN IF EXISTS perk_uuid;

-- 4) Add FK to participants composite PK for integrity
ALTER TABLE public.passes
  ADD CONSTRAINT passes_participant_fk
  FOREIGN KEY (program_id, perk_participant_id)
  REFERENCES public.participants (program_id, perk_participant_id)
  ON DELETE CASCADE;

-- 5) Helpful index for lookups
CREATE INDEX IF NOT EXISTS ix_passes_program_pid
  ON public.passes (program_id, perk_participant_id);

-- Note: we intentionally do NOT add a unique constraint because some kinds 
-- (coupon, ticket, giftcard) may allow multiple passes per participant.