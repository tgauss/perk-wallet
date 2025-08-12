# Claude Code Context - Perk Wallet Admin System

## Last Updated: 2025-08-12

### Session Summary
Built a comprehensive Admin interface with role-based access control (RBAC), program management system, participant data alignment with Perk API, notification system with merging/throttling, and comprehensive admin tools for the Perk Wallet application.

## Major Features Implemented

### 1. Admin Interface with Role Emulator
- **Location**: `/src/app/(admin)/admin/*`
- **Purpose**: Complete admin dashboard without real authentication
- **Key Files**:
  - `/src/lib/auth-emulator.ts` - JWT-based role emulation
  - `/src/lib/perm.ts` - Permission system
  - `/src/app/(admin)/admin/emulator/page.tsx` - Role selector UI

#### Available Roles:
- `super_admin`: Full access across all programs
- `program_admin`: Full access within assigned program
- `program_editor`: Edit templates, manage passes, no secrets
- `program_viewer`: Read-only access  
- `support`: Limited write (reissue passes, resend links)

### 2. Program Management System
- **New Program Creation** (`/admin/programs/new`)
  - API key validation against Perk API
  - Comprehensive branding configuration
  - Status system (draft/active/inactive)
  - Webhook URL generation
  - Multi-tenant architecture support

- **Program Status Management**
  - Status transitions with effects preview
  - Safe configuration in draft mode
  - Automatic webhook pause/resume
  - Participant data preservation

### 3. Admin Pages Implemented

#### Dashboard (`/admin`)
- System-wide or program-scoped KPIs
- Real-time activity monitoring
- Success rates and health metrics

#### Programs (`/admin/programs`)
- List all programs (super_admin) or assigned
- New Program button for super admins
- Status badges and participant counts
- Debug info showing role/permissions

#### Templates (`/admin/templates`)
- JSON editor with syntax highlighting
- Template versioning with bump functionality
- Zod validation for schemas

#### Participants (`/admin/participants`)
- Search by email or UUID
- View points and tier status
- Reissue passes and resend install links

#### Passes (`/admin/passes`)
- View all wallet passes
- Sync status monitoring
- Force update capabilities

#### Jobs (`/admin/jobs`)
- Background job monitoring
- Error details and payloads
- Retry failed jobs

#### Webhooks (`/admin/webhooks`)
- Event history with payloads
- Pretty-print JSON data
- cURL command generation

### 4. Version Indicator
- **Location**: `/src/components/version-indicator.tsx`
- Shows git commit hash or 'dev'
- Fixed position bottom-right
- Helps verify deployment status

### 5. Participant Data Alignment System
- **Location**: `/src/lib/perk/*`
- **Purpose**: Normalize Perk participant data into consistent snapshots
- **Key Features**:
  - Complete Perk API schema validation with Zod
  - ParticipantSnapshot interface for internal consistency
  - Tier fallback to status when tier is null
  - Points display configuration (unused_points vs points)
  - Database normalization with fromDatabaseRow()

### 6. Merge Tag System
- **Location**: `/src/lib/mergeTags.ts`
- **Purpose**: Dynamic template content replacement
- **Supported Tags**: 16 total including:
  - `{points}`, `{unused_points}`, `{tier}`, `{status}`
  - `{email}`, `{fname}`, `{lname}`, `{full_name}`
  - `{program_name}`, `{profile.*}` (dynamic attributes)
  - `{points_delta}`, `{new_points}` (notification-specific)
- **Features**: Tag validation, unknown tag detection, template warnings

### 7. Notification System with Merging & Throttling
- **Location**: `/src/lib/notify.ts`, `/src/lib/notify-flush.ts`
- **Purpose**: Intelligent notification delivery to prevent spam
- **Key Features**:
  - 120-second merge window for rapid point updates
  - 300-second throttling per participant+rule
  - Points delta calculation using program settings
  - In-memory buffering with automatic flush
  - Support for multiple notification rules (manual, points_updated, reward_earned, location_enter)

### 8. Admin Testing Tools
- **Simulate Points Burst** (`/admin/participants/[perk_uuid]`)
  - Development-only testing interface
  - Configurable event count, points per event, duration
  - Synthetic notification events without affecting Perk balances
  - Real-time monitoring via Jobs page integration
  - Requires super_admin or program_admin role

## Technical Implementation Details

### Database Schema Updates
```sql
-- Added to programs table via settings JSONB column
settings: {
  status: 'draft' | 'active' | 'inactive',
  points_display: 'points' | 'unused_points' (default: 'unused_points'),
  // other program-specific settings
}

-- Enhanced participants table with Perk alignment
participants: {
  perk_participant_id: number,
  perk_uuid: string,
  email: string,
  points: number,
  unused_points: number,  -- NEW: Available balance for redemption
  tier: string | null,
  status: string | null,
  fname: string | null,   -- NEW: First name
  lname: string | null,   -- NEW: Last name
  tag_list: string[],     -- NEW: Participant tags
  profile_attributes: Record<string, any>,
  // ... existing webhook tracking fields
}

-- Templates table field standardization
templates: {
  pass_kind: 'loyalty' | 'rewards'  -- Changed from pass_type for consistency
  // ... other fields unchanged
}
```

### Key Library Files

#### `/src/lib/admin-service.ts`
- Connects admin UI to real Supabase data
- Replaces mock data with database queries
- Program-scoped data filtering

#### `/src/lib/admin-actions.ts`
- Server actions for admin operations
- Permission checks before operations
- API key validation and program creation

#### `/src/lib/program-utils.ts`
- Utility functions for status transitions
- Type definitions for ProgramStatus
- Client-side helpers

#### `/src/lib/perk-api.ts`
- Perk API integration
- API key validation
- Program data fetching

#### `/src/lib/perk/schemas.ts`
- Comprehensive Zod schemas for Perk participant data
- Validation for both full API responses and webhook payloads
- Type-safe parsing with error handling

#### `/src/lib/perk/normalize.ts`
- ParticipantSnapshot interface definition
- Data normalization functions (toSnapshot, fromDatabaseRow)
- Tier fallback logic and data consistency

#### `/src/lib/mergeTags.ts`
- Complete merge tag system for templates
- Tag resolution, replacement, and validation
- Support for 16+ dynamic content tags
- Unknown tag detection and warnings

#### `/src/lib/notify.ts` & `/src/lib/notify-flush.ts`
- Intelligent notification system with buffering
- Event merging within configurable time windows
- Throttling to prevent notification spam
- Support for multiple notification rules
- Points delta calculation using program settings

### Security Features
- Server-side permission checks on all actions
- API keys never sent to client
- Signed JWT cookies for identity
- Role-based UI adaptation
- Emulator requires APP_EMULATOR_SECRET

## Environment Variables Required
```bash
# Admin Emulator (Required for admin access)
APP_EMULATOR_SECRET=your-secure-secret-here

# Existing Perk/Supabase configs...
```

## Known Issues and Fixes Applied

### Build Errors Fixed
1. **Tailwind CSS v4 incompatibility** 
   - Migrated to v3 for shadcn/ui compatibility
   
2. **Server Actions error**
   - Moved utility functions out of "use server" files
   - Created separate program-utils.ts

3. **Failed to fetch on impersonate**
   - Fixed API route cookie handling

### Current Deployment
- **Platform**: Vercel
- **URL**: https://pass.perk.ooo
- **Auto-deploy**: Yes, on push to main branch
- **Region**: iad1 (US East)

## How to Use Admin Interface

### First Time Setup
1. Set `APP_EMULATOR_SECRET` in environment
2. Visit `/admin/emulator`
3. Select "Super Admin" role
4. Click "Impersonate"
5. Access full admin at `/admin`

### Creating a New Program
1. Must be super_admin role
2. Go to `/admin/programs`
3. Click "New Program" button
4. Fill in:
   - Perk Program ID
   - Program Name
   - API Key (will be validated)
   - Status (start with 'draft')
   - Branding configuration
5. Copy generated webhook URL
6. Add webhook URL to Perk program settings

### Managing Programs
- View program details at `/admin/programs/[id]`
- Edit branding and settings
- Change status with effects preview
- Monitor participants and passes

## Testing Instructions

### Verify Deployment
1. Check version indicator (bottom-right)
2. Should show git commit hash
3. Latest commit: `ee03f8a` or newer

### Test Permissions
1. Visit `/admin/programs`
2. Check debug badge shows:
   - Role: super_admin
   - Super: Yes
   - ViewAll: Yes
3. New Program button should be visible

### Test Program Creation
1. Click New Program
2. Use test API key
3. Start in draft status
4. Verify webhook URL generation

## Recent Changes Log

### 2025-08-12 Session - Part 2: Participant Data Alignment & Notifications
- ✅ **Perk Data Alignment**: Created comprehensive Perk participant schemas and normalization
- ✅ **ParticipantSnapshot Interface**: Unified data model with tier fallback logic
- ✅ **Points Display Configuration**: Per-program setting for unused_points vs total points
- ✅ **Merge Tag System**: 16+ dynamic content tags with validation and error detection
- ✅ **Notification System**: Intelligent merging (120s window) and throttling (300s)
- ✅ **Admin Testing Tools**: Simulate points burst feature for development testing
- ✅ **Database Schema Updates**: Enhanced participants table, templates.pass_kind standardization
- ✅ **Webhook Integration**: Auto-queue notifications for points_updated events
- ✅ **Pass Builder Updates**: Use ParticipantSnapshot interface across Apple/Google builders
- ✅ **Comprehensive Testing**: Unit tests for normalization, merge tags, and notifications

### 2025-08-12 Session - Part 1: Admin Interface & RBAC
- ✅ Built complete admin interface with role emulator
- ✅ Implemented RBAC with 5 roles
- ✅ Created 7 admin pages (dashboard, programs, templates, etc.)
- ✅ Added real Supabase data integration
- ✅ Built program management with API validation
- ✅ Implemented status system (draft/active/inactive)
- ✅ Removed webhook secrets per user preference
- ✅ Added version indicator for deployment tracking
- ✅ Fixed all build errors and deployment issues
- ✅ Added debug information for troubleshooting

## Next Steps Recommendations

1. **Authentication**: Replace emulator with real auth when ready
2. **Monitoring**: Add error tracking (Sentry)
3. **Logging**: Implement audit logs for admin actions
4. **Backup**: Regular database backups
5. **Testing**: Add E2E tests for admin workflows
6. **Documentation**: API documentation for webhooks

## Important Notes

- Admin interface is production-ready but uses emulator for auth
- All sensitive operations have server-side validation
- API keys are never exposed to client
- Multi-program support is fully implemented
- Webhook endpoints are program-specific: `/api/webhooks/perk/{programId}`

## File Structure Reference
```
/src/app/(admin)/admin/
├── emulator/          # Role selection
├── programs/          # Program management
│   ├── [id]/         # Program details
│   └── new/          # Create program
├── templates/         # Template editor
├── participants/      # User management
├── passes/           # Pass management
├── jobs/             # Job monitoring
├── webhooks/         # Event tracking
└── page.tsx          # Dashboard

/src/lib/
├── auth-emulator.ts   # Role emulation
├── perm.ts           # Permissions
├── admin-service.ts  # Data fetching
├── admin-actions.ts  # Server actions
├── program-utils.ts  # Utilities
├── perk-api.ts       # Perk integration
├── perk/             # Perk data alignment
│   ├── schemas.ts    # Zod validation schemas
│   └── normalize.ts  # ParticipantSnapshot interface
├── mergeTags.ts      # Template merge tag system
├── notify.ts         # Notification system
└── notify-flush.ts   # Notification flushing

/src/components/
├── admin/            # Admin UI components
└── version-indicator.tsx  # Version badge
```

## Commands for Development

```bash
# Start local development
pnpm dev

# Access admin locally
open http://localhost:3000/admin/emulator

# Check deployment status
git log --oneline -1  # Latest commit
```

## Troubleshooting

### "New Program" button not visible
1. Check role is super_admin in emulator
2. Look at debug badge for permissions
3. Clear cookies and re-impersonate

### Version indicator shows "dev"
- Normal for local development
- Production shows git commit hash

### Build failures
- All known issues fixed as of commit `ee03f8a`
- Ensure using Tailwind CSS v3
- Server actions must be async

---

This document should be kept updated as new features are added. It serves as the primary reference for understanding the admin system implementation.