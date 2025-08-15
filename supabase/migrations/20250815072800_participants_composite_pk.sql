-- Remove perk_uuid and switch to composite primary key (program_id, perk_participant_id)
-- This migration drops the old perk_uuid column and establishes the composite key

-- 1) Make columns required
ALTER TABLE public.participants
  ALTER COLUMN program_id SET NOT NULL,
  ALTER COLUMN perk_participant_id SET NOT NULL;

-- 2) Drop old PK if present and set new composite PK
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'participants_pkey'
      AND conrelid = 'public.participants'::regclass
  ) THEN
    ALTER TABLE public.participants DROP CONSTRAINT participants_pkey;
  END IF;
END$$;

ALTER TABLE public.participants
  ADD PRIMARY KEY (program_id, perk_participant_id);

-- 3) Drop perk_uuid column if it exists
ALTER TABLE public.participants
  DROP COLUMN IF EXISTS perk_uuid;

-- 4) Helpful indexes already exist; keep ux_participants_program_pid & ix_participants_perk_pid
-- No additional indexes needed as the composite PK provides the necessary uniqueness