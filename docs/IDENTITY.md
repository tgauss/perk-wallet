# Identity Model

Comprehensive guide to Perk Wallet's composite key architecture and dual addressing system.

## Overview

Perk Wallet uses a **composite key architecture** that separates public-facing identifiers from internal implementation details, providing clean APIs while maintaining data integrity and multi-tenant isolation.

## Core Concepts

### Dual Addressing

- **Public Routes**: Use Perk Program IDs (integers) for clean, simple URLs
- **Internal Systems**: Use UUIDs for strong identity and security
- **Resolver Pattern**: Automatically bridges between the two systems

### Composite Primary Keys

```sql
-- Old approach (removed in v0.6.0)
participants(perk_uuid UUID PRIMARY KEY)

-- New approach (v0.6.0+)
participants(
  program_id UUID,
  perk_participant_id BIGINT,
  PRIMARY KEY (program_id, perk_participant_id)
)
```

## Database Schema

### Programs Table

```sql
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perk_program_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  api_key TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  -- ... branding fields
);

-- Example data
id: 3648cab8-a29f-4d13-9160-f1eab36e88bd
perk_program_id: 44
name: "Buckeye Nation Rewards"
```

### Participants Table

```sql
CREATE TABLE participants (
  program_id UUID NOT NULL,
  perk_participant_id BIGINT NOT NULL,
  email TEXT,
  points INTEGER DEFAULT 0,
  unused_points INTEGER DEFAULT 0,
  status TEXT,
  tier TEXT,
  fname TEXT,
  lname TEXT,
  profile_attributes JSONB DEFAULT '{}',
  tag_list JSONB DEFAULT '[]',
  -- Webhook tracking
  last_webhook_event_type TEXT,
  last_webhook_event_at TIMESTAMPTZ,
  webhook_event_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (program_id, perk_participant_id),
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);

-- Example data
program_id: 3648cab8-a29f-4d13-9160-f1eab36e88bd
perk_participant_id: 246785
email: "demo@example.com"
```

### Passes Table

```sql
CREATE TABLE passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL,
  perk_participant_id BIGINT NOT NULL,
  pass_kind TEXT NOT NULL,
  apple_serial_number TEXT,
  google_object_id TEXT,
  pass_data JSONB NOT NULL,
  data_hash TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),

  FOREIGN KEY (program_id, perk_participant_id)
    REFERENCES participants(program_id, perk_participant_id) ON DELETE CASCADE
);
```

## Program Resolver

### Resolver Functions

Located in `/src/lib/programs.ts`:

```typescript
// Resolve by either UUID or Perk Program ID
async function resolveProgram(
  input: string | number,
): Promise<ResolvedProgram | null>;

// Specific lookups
async function getProgramByPerkId(
  perkProgramId: number,
): Promise<Program | null>;
async function getProgramByUuid(programId: string): Promise<Program | null>;

// Validation
async function validateProgram(input: string | number): Promise<boolean>;
```

### Usage Examples

```typescript
// Resolve Perk Program ID to internal UUID
const resolved = await resolveProgram(44);
// → { program: { id: "3648cab8-...", perk_program_id: 44 }, reason: "by_perk_id" }

// Resolve UUID (internal routes)
const resolved = await resolveProgram("3648cab8-a29f-4d13-9160-f1eab36e88bd");
// → { program: { ... }, reason: "by_uuid" }

// Direct lookups
const program = await getProgramByPerkId(44);
const program = await getProgramByUuid("3648cab8-a29f-4d13-9160-f1eab36e88bd");
```

## Route Patterns

### Public Routes (Perk Program IDs)

```bash
# Install routes use Perk Program IDs
/w/44/246785                    # Program 44, Participant 246785
/w/44/246785/loyalty           # Specific pass kind
/w/44/246785/loyalty/location/store-123  # With resource context

# API routes use Perk Program IDs
/api/webhooks/perk/44          # Webhook endpoint for program 44
/api/passes/44/246785          # Pass management
```

### Admin Routes (UUIDs)

```bash
# Internal admin routes use UUIDs
/admin/programs/3648cab8-a29f-4d13-9160-f1eab36e88bd
/admin/programs/3648cab8-a29f-4d13-9160-f1eab36e88bd/branding
/admin/programs/3648cab8-a29f-4d13-9160-f1eab36e88bd/templates

# Short redirect routes (Perk Program ID → UUID)
/admin/p/44 → 307 redirect to /admin/programs/3648cab8-...
```

## Query Patterns

### Finding Participants

```typescript
// By composite key (preferred)
const { data: participant } = await supabase
  .from("participants")
  .select("*")
  .eq("program_id", program.id)
  .eq("perk_participant_id", 246785)
  .maybeSingle();

// Search across participants in a program
const { data: participants } = await supabase
  .from("participants")
  .select("*")
  .eq("program_id", program.id)
  .ilike("email", "%demo@example.com%");
```

### Managing Passes

```typescript
// Find passes for participant
const { data: passes } = await supabase
  .from("passes")
  .select("*")
  .eq("program_id", program.id)
  .eq("perk_participant_id", 246785);

// Find specific pass
const { data: pass } = await supabase
  .from("passes")
  .select("*")
  .eq("program_id", program.id)
  .eq("perk_participant_id", 246785)
  .eq("pass_kind", "loyalty")
  .maybeSingle();
```

### Webhook Event Tracking

```typescript
// Track events by program and participant
const { data: events } = await supabase
  .from("webhook_events")
  .select("*")
  .eq("program_id", program.id)
  .eq("participant_perk_id", 246785)
  .order("created_at", { ascending: false });
```

## Migration Strategy

### From perk_uuid to Composite Key

The migration from `perk_uuid` to composite keys involved several steps:

#### 1. Database Schema Migration

```sql
-- Remove old perk_uuid column
ALTER TABLE participants DROP COLUMN perk_uuid;

-- Add composite primary key
ALTER TABLE participants
ADD CONSTRAINT participants_pkey
PRIMARY KEY (program_id, perk_participant_id);

-- Update passes table
ALTER TABLE passes DROP COLUMN perk_uuid;
ALTER TABLE passes ADD COLUMN perk_participant_id BIGINT;
ALTER TABLE passes ADD CONSTRAINT passes_participant_fkey
FOREIGN KEY (program_id, perk_participant_id)
REFERENCES participants(program_id, perk_participant_id);
```

#### 2. Code Updates

- Updated all database queries to use composite keys
- Replaced `perk_uuid` parameters with `perk_participant_id`
- Updated TypeScript interfaces and types
- Modified API routes to use new identity pattern

#### 3. URL Structure Changes

```bash
# Old URLs (removed)
/w/{programId}/{perkUuid}

# New URLs (v0.6.0+)
/w/{perkProgramId}/{perkParticipantId}
```

## Benefits of Composite Key Architecture

### 1. Data Integrity

- **Foreign key constraints** enforce referential integrity
- **Composite keys** prevent orphaned data
- **Program isolation** prevents cross-program data access

### 2. Performance

- **Efficient queries** using program_id + perk_participant_id
- **Index optimization** on composite keys
- **Reduced join operations** for participant lookups

### 3. Security

- **Program scoping** built into data model
- **UUID internal IDs** provide security through obscurity
- **Clean public APIs** don't expose internal implementation

### 4. Scalability

- **Multi-tenant by design** - unlimited programs
- **Predictable query patterns** for each program
- **Horizontal scaling** potential by program partitioning

## QR Code Grammar

### Format

```
{perkProgramId}.{perkParticipantId}[.{passKind}[.{resourceType}.{resourceId}]]
```

### Examples

```bash
44.246785                      # Basic participant reference
44.246785.loyalty             # Specific pass reference
44.246785.loyalty.location.store-123  # Resource-specific reference
44.246785.rewards.product.item-456    # Product-specific reference
```

### QR Code Generation

```typescript
import { buildQr } from "@/lib/qr";

const qrCode = buildQr({
  programId: 44, // Perk Program ID (public)
  perkParticipantId: 246785,
  passKind: "loyalty",
  resourceType: "location",
  resourceId: "store-123",
});
// → "44.246785.loyalty.location.store-123"
```

## Best Practices

### 1. Always Use Resolver

```typescript
// ✅ Good - Use resolver
const resolved = await resolveProgram(programId);
if (!resolved) return notFound();

// ❌ Bad - Manual database query
const { data } = await supabase
  .from("programs")
  .select("*")
  .eq("id", programId);
```

### 2. Validate Input Types

```typescript
// Detect UUID vs Perk Program ID
const isUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input);

if (isUuid) {
  // Query by programs.id
} else {
  // Query by programs.perk_program_id
}
```

### 3. Use Composite Keys in Queries

```typescript
// ✅ Good - Composite key query
.eq('program_id', program.id)
.eq('perk_participant_id', participantId)

// ❌ Bad - Single column query (no longer exists)
.eq('perk_uuid', uuid)
```

### 4. Program Scoping

```typescript
// Always scope queries to program
const { data } = await supabase
  .from("participants")
  .select("*")
  .eq("program_id", program.id) // ✅ Program scoping
  .eq("perk_participant_id", participantId);
```

## Error Handling

### Common Issues and Solutions

#### 1. Participant Not Found

```typescript
const { data: participant } = await supabase
  .from("participants")
  .select("*")
  .eq("program_id", program.id)
  .eq("perk_participant_id", participantId)
  .maybeSingle(); // ✅ Use maybeSingle(), not single()

if (!participant) {
  return NextResponse.json(
    {
      ok: false,
      error: "participant_not_found",
      detail: `Participant ${participantId} not found in program`,
    },
    { status: 404 },
  );
}
```

#### 2. Program Resolution Failures

```typescript
const resolved = await resolveProgram(input);
if (!resolved) {
  return NextResponse.json(
    {
      ok: false,
      error: "invalid_scope",
      detail: "Program not found",
    },
    { status: 404 },
  );
}
```

#### 3. Foreign Key Violations

```typescript
// Ensure program exists before creating participant
const program = await getProgramByPerkId(perkProgramId);
if (!program) {
  throw new Error("Program must exist before creating participant");
}

await supabase.from("participants").insert({
  program_id: program.id, // ✅ Valid foreign key
  perk_participant_id: participantId,
  // ...
});
```
