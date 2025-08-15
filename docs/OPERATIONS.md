# Operations Guide

Administrative tasks, troubleshooting, and operational procedures for Perk Wallet.

## Getting Started

### Initial System Setup

#### 1. Verify Environment

```bash
# Check all required environment variables
curl http://localhost:3000/api/admin/doctor

# Response should show all environment checks as "ok"
```

#### 2. Access Admin Interface

```bash
# 1. Set emulator secret (required)
echo "APP_EMULATOR_SECRET=your-secure-secret" >> .env.local

# 2. Visit emulator
open http://localhost:3000/admin/emulator

# 3. Select "Super Admin" role
# 4. Access admin dashboard at /admin
```

#### 3. Create First Program

```bash
# Via admin interface:
# /admin/programs → "New Program" → Fill form with:
# - Perk Program ID: 44
# - Program Name: "Test Program"
# - API Key: your-perk-api-key
# - Status: "draft" (for safe testing)
```

## Program Management

### Creating a New Program

#### Step 1: Gather Requirements

```bash
# Required information:
# - Perk Program ID (integer from Perk platform)
# - Program Name (display name)
# - Perk API Key (program-specific)
# - Default pass group (usually ["loyalty", "rewards"])
```

#### Step 2: Create via Admin Interface

```bash
# Navigate to /admin/programs
# Click "New Program"
# Fill required fields:

{
  "perk_program_id": 44,
  "name": "Buckeye Nation Rewards",
  "api_key": "your-api-key-here",
  "status": "draft"
}

# Generated webhook URL will be displayed
# Copy URL for Perk platform configuration
```

#### Step 3: Configure Perk Platform

```bash
# Add webhook URL to Perk program settings:
# https://pass.perk.ooo/api/webhooks/perk/44

# Configure webhook events:
# - participant_created
# - participant_points_updated
# - reward_earned
# - challenge_completed
```

#### Step 4: Seed Test Participant

```sql
-- Run in Supabase SQL editor
INSERT INTO participants (
  program_id,
  perk_participant_id,
  email,
  status,
  profile_attributes,
  tag_list,
  updated_at
) VALUES (
  'your-program-uuid-here',
  246785,
  'test@example.com',
  'active',
  '{}'::jsonb,
  '[]'::jsonb,
  NOW()
) ON CONFLICT (program_id, perk_participant_id)
DO UPDATE SET updated_at = NOW();
```

### Program Status Management

#### Status Transitions

```bash
# Draft → Active
# - Enables webhook processing
# - Allows pass issuance
# - Makes program live

# Active → Inactive
# - Pauses webhook processing
# - Preserves existing passes
# - Stops new pass issuance

# Inactive → Active
# - Resumes webhook processing
# - Enables pass updates
```

#### Change Program Status

```bash
# Via admin interface:
# /admin/programs/{id} → Edit Settings → Status dropdown
# Review impact before confirming change
```

### Default Install Group Configuration

#### Set Default Pass Types

```sql
-- Update program settings
UPDATE programs
SET settings = settings || jsonb_build_object(
  'default_install_group', '["loyalty", "rewards"]'::jsonb
)
WHERE id = 'your-program-uuid';
```

#### Via Admin Interface

```bash
# /admin/programs/{id} → Edit Settings
# Default Install Group: Select pass types
# Usually: loyalty, rewards
# Save changes
```

## Participant Management

### Seeding Test Participants

#### Method 1: SQL Insert

```sql
INSERT INTO participants (
  program_id,
  perk_participant_id,
  email,
  points,
  unused_points,
  status,
  tier,
  fname,
  lname,
  profile_attributes
) VALUES (
  'program-uuid-here',
  246785,
  'test@example.com',
  1000,
  750,
  'active',
  'Gold',
  'John',
  'Doe',
  '{"seat_section": "A", "favorite_team": "Buckeyes"}'::jsonb
);
```

#### Method 2: Via Webhook

```bash
# Simulate webhook event
curl -X POST "https://pass.perk.ooo/api/webhooks/perk/44" \
  -H "Content-Type: application/json" \
  -H "Perk-Signature: sha256=valid-signature" \
  -d '{
    "event": "participant_created",
    "data": {
      "participant": {
        "id": 246785,
        "email": "test@example.com",
        "points": 0,
        "unused_points": 0,
        "status": "active"
      }
    }
  }'
```

### Searching Participants

#### Via Admin Interface

```bash
# /admin/participants
# Search by:
# - Email: user@example.com
# - Perk Participant ID: 246785
# Results show points, tier, status
```

#### Via SQL Query

```sql
-- Find participant by email
SELECT * FROM participants
WHERE email ILIKE '%user@example.com%';

-- Find by participant ID and program
SELECT * FROM participants
WHERE program_id = 'program-uuid'
  AND perk_participant_id = 246785;

-- Count participants by program
SELECT program_id, COUNT(*)
FROM participants
GROUP BY program_id;
```

### Updating Participant Data

#### Points and Tier Updates

```sql
-- Update participant data
UPDATE participants
SET
  points = 1500,
  unused_points = 1200,
  tier = 'Platinum',
  profile_attributes = profile_attributes || '{"favorite_color": "Blue"}'::jsonb
WHERE program_id = 'program-uuid'
  AND perk_participant_id = 246785;
```

#### Via Admin Interface

```bash
# /admin/participants → Search → Select participant
# Actions available:
# - Reissue passes
# - Resend install link
# - Simulate points burst (development only)
```

## Running Diagnostics

### System Health Check

#### Full Diagnostics

```bash
curl -X POST "http://localhost:3000/api/admin/diagnostics/install" \
  -H "Content-Type: application/json" \
  -d '{
    "perk_program_id": 44,
    "perk_participant_id": 246785,
    "kinds": ["loyalty", "rewards"]
  }'
```

#### Expected Healthy Response

```json
{
  "ok": true,
  "program": {
    "id": "3648cab8-a29f-4d13-9160-f1eab36e88bd",
    "name": "Buckeye Nation Rewards",
    "default_group": ["loyalty", "rewards"]
  },
  "participant": {
    "exists": true
  },
  "checks": [
    {
      "kind": "loyalty",
      "published_template": true,
      "apple_ready": true,
      "google_ready": true,
      "assets_ok": true,
      "qr_preview": "44.246785.loyalty",
      "issues": []
    }
  ]
}
```

### Environment Diagnostics

```bash
# Check environment variables and connectivity
curl "http://localhost:3000/api/admin/doctor?program_id=44"

# Reviews:
# - Environment variables (all required vars present)
# - Supabase connectivity
# - Program resolution
# - Database schema
# - File system access
```

### Apple Wallet Diagnostics

```bash
# Check Apple Wallet certificates and configuration
curl "http://localhost:3000/api/admin/apple/doctor"

# Also available via admin:
# /admin/apple-check
```

### Template Status Check

```sql
-- Check template publication status
SELECT
  program_id,
  pass_kind,
  version,
  is_active,
  created_at
FROM templates
WHERE program_id = 'program-uuid'
ORDER BY pass_kind, version DESC;
```

## Common Failure Reasons

### 1. Participant Not Found

```bash
# Symptom: diagnostics shows participant.exists: false
# Solution: Seed participant or trigger webhook

# Check if participant exists
SELECT * FROM participants
WHERE program_id = 'program-uuid'
  AND perk_participant_id = 246785;

# If missing, create via SQL or webhook
```

### 2. Template Not Published

```bash
# Symptom: published_template: false
# Solution: Publish templates for required pass kinds

# Check template status
SELECT pass_kind, is_active FROM templates
WHERE program_id = 'program-uuid';

# Publish missing templates via admin interface
```

### 3. Apple/Google Not Ready

```bash
# Symptom: apple_ready: false or google_ready: false
# Solution: Check certificate configuration

# Apple issues:
# - APPLE_PASS_CERT_P12_BASE64 missing or invalid
# - APPLE_PASS_CERT_PASSWORD incorrect
# - Certificate expired

# Google issues:
# - GOOGLE_WALLET_SERVICE_ACCOUNT_KEY invalid
# - Service account permissions insufficient
# - Issuer ID mismatch
```

### 4. Install Route Failures

```bash
# Symptom: 500 errors on /w/{programId}/{participantId}
# Troubleshooting steps:

# 1. Check program resolution
curl "http://localhost:3000/api/admin/doctor?program_id=44"

# 2. Verify participant exists
# See participant diagnostics above

# 3. Check template publication
# See template diagnostics above

# 4. Review server logs for specific errors
tail -f /tmp/next-dev.log
```

### 5. Webhook Processing Failures

```bash
# Symptom: Events not processed, no participant updates
# Troubleshooting:

# 1. Verify webhook signature
# - Check PERK_WEBHOOK_SECRET matches Perk platform
# - Ensure signature validation is working

# 2. Check program status
# - Program must be "active" to process webhooks
# - "draft" and "inactive" programs ignore webhooks

# 3. Review webhook events table
SELECT event_type, processed_at, error_details
FROM webhook_events
WHERE program_id = 'program-uuid'
ORDER BY created_at DESC
LIMIT 10;
```

## Performance Monitoring

### Key Metrics to Track

#### Response Times

```bash
# Install route performance
curl -w "@curl-format.txt" "https://pass.perk.ooo/w/44/246785"

# curl-format.txt:
# time_namelookup:  %{time_namelookup}\n
# time_connect:     %{time_connect}\n
# time_total:       %{time_total}\n
```

#### Database Performance

```sql
-- Monitor slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
WHERE mean_time > 1000  -- queries taking > 1 second
ORDER BY mean_time DESC;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_total_relation_size(tablename::regclass) as size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;
```

#### Error Rates

```sql
-- Monitor job failures
SELECT
  type,
  status,
  COUNT(*) as count
FROM jobs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY type, status;

-- Check webhook processing success
SELECT
  event_type,
  COUNT(*) as total,
  COUNT(CASE WHEN processed_at IS NOT NULL THEN 1 END) as processed,
  COUNT(CASE WHEN error_details IS NOT NULL THEN 1 END) as failed
FROM webhook_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY event_type;
```

## Backup and Recovery

### Database Backup

```bash
# Full database backup (via Supabase CLI)
supabase db dump --file backup-$(date +%Y%m%d).sql

# Table-specific backups
pg_dump -h your-host -U postgres -t participants > participants-backup.sql
pg_dump -h your-host -U postgres -t programs > programs-backup.sql
```

### Asset Backup

```bash
# Backup Supabase Storage assets
# Via admin interface or API
curl "https://your-project.supabase.co/storage/v1/object/list/pass-assets" \
  -H "Authorization: Bearer your-service-role-key"
```

### Recovery Procedures

```bash
# Restore from backup
psql -h your-host -U postgres -d postgres < backup-20250815.sql

# Restore specific tables
psql -h your-host -U postgres -d postgres < participants-backup.sql
```

## Security Checklist

### Environment Security

- [ ] `APP_EMULATOR_SECRET` set in production
- [ ] `QR_SIGNING_SECRET` is cryptographically random
- [ ] All `NEXT_PUBLIC_*` vars safe for client exposure
- [ ] API keys rotated regularly

### Access Control

- [ ] Admin interface requires authentication
- [ ] Role-based permissions enforced server-side
- [ ] Program data isolation verified
- [ ] Webhook signatures validated

### Certificate Management

- [ ] Apple certificates not expired
- [ ] Google service account keys valid
- [ ] Certificate private keys secured
- [ ] Regular certificate rotation schedule

## Monitoring and Alerting

### Critical Alerts

```bash
# Set up monitoring for:
# - Install route 500 errors > 1%
# - Webhook processing failures > 5%
# - Database connection failures
# - Certificate expiration warnings (30 days)
# - Disk space usage > 80%
```

### Log Monitoring

```bash
# Key log patterns to monitor:
grep "Install error" /var/log/app.log
grep "Webhook signature invalid" /var/log/app.log
grep "Certificate expired" /var/log/app.log
grep "Database connection failed" /var/log/app.log
```

### Health Check Endpoints

```bash
# Automated health checks
curl https://pass.perk.ooo/api/admin/doctor
curl https://pass.perk.ooo/api/debug

# Should return 200 OK with healthy status
```
