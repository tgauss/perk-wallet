# Perk Wallet Feature Map

This document provides a comprehensive mapping of all features, files, and capabilities in the Perk Wallet Admin System.

## 🎯 Core Features Overview

### 1. Admin Interface with RBAC (v0.2.0)
- **Path**: `/admin/*`
- **Authentication**: Role emulator with JWT cookies
- **Roles**: 5 levels (super_admin → support)
- **Pages**: 7 admin pages with real-time data

### 2. Participant Data Alignment (v0.3.0)
- **Purpose**: Normalize Perk API data into consistent format
- **Key Interface**: `ParticipantSnapshot`
- **Features**: Schema validation, tier fallback, points mapping

### 3. Notification System (v0.3.0)
- **Purpose**: Intelligent notification delivery
- **Features**: 120s merge window, 300s throttling, delta calculation
- **Rules**: manual, points_updated, reward_earned, location_enter

### 4. Merge Tag System (v0.3.0)
- **Purpose**: Dynamic template content replacement
- **Tags**: 16+ supported including profile attributes
- **Features**: Validation, unknown tag detection, warnings

## 📁 File Structure Mapping

### Admin Interface Files
```
/src/app/(admin)/admin/
├── emulator/page.tsx           # Role selection and authentication
├── page.tsx                    # Main dashboard with KPIs
├── programs/
│   ├── page.tsx               # Program list and management
│   ├── [id]/page.tsx          # Program details and settings
│   ├── [id]/edit-program-form.tsx  # Program configuration UI
│   └── new/new-program-form.tsx    # Create new program
├── templates/
│   ├── page.tsx               # Template list and management
│   └── template-editor.tsx    # JSON editor with validation
├── participants/
│   ├── page.tsx               # Participant search
│   ├── participants-search.tsx    # Search component
│   └── [perk_uuid]/
│       ├── page.tsx           # Participant details
│       └── simulate-points-burst.tsx  # Testing tools
├── passes/page.tsx            # Pass monitoring and control
├── jobs/page.tsx              # Background job monitoring
└── webhooks/page.tsx          # Event tracking and replay
```

### Core Library Files
```
/src/lib/
├── auth-emulator.ts           # JWT-based role emulation
├── perm.ts                    # Permission system
├── admin-service.ts           # Data fetching service
├── admin-actions.ts           # Server actions
├── supabase.ts               # Database schema and client
├── perk-api.ts               # Perk API integration
├── perk/                     # Participant data alignment
│   ├── schemas.ts            # Zod validation schemas
│   └── normalize.ts          # ParticipantSnapshot interface
├── mergeTags.ts              # Template merge tag system
├── notify.ts                 # Notification system
└── notify-flush.ts           # Background flushing
```

### API Routes
```
/src/app/api/
├── admin/emulator/            # Role emulator endpoints
├── dev/simulate/points-burst/ # Testing API (dev only)
├── passes/
│   ├── issue/route.ts         # Pass generation
│   └── [perk_uuid]/route.ts   # Pass updates
└── webhooks/perk/[programId]/ # Per-program webhooks
```

## 🗄️ Database Schema Map

### Enhanced Tables (v0.3.0+)

#### participants
```sql
participants {
  id: string (UUID)
  perk_uuid: string              -- Our internal UUID
  program_id: string             -- Program association
  perk_participant_id: number    -- Perk's participant ID
  email: string
  points: number                 -- Total lifetime points
  unused_points: number          -- Available balance (NEW)
  tier: string | null
  status: string | null
  fname: string | null           -- First name (NEW)
  lname: string | null           -- Last name (NEW)
  tag_list: string[]             -- Participant tags (NEW)
  profile_attributes: JSONB      -- Profile data
  -- Webhook tracking fields
  last_webhook_event_type: string | null
  last_webhook_event_at: timestamp | null
  webhook_event_count: number
  created_at: timestamp
  updated_at: timestamp
}
```

#### programs
```sql
programs {
  id: string (UUID)
  perk_program_id: number
  name: string
  description: string | null
  api_key: string
  webhook_secret: string
  apple_pass_type_id: string | null
  google_wallet_class_id: string | null
  settings: JSONB {               -- Program configuration
    status: 'draft' | 'active' | 'inactive'
    points_display: 'points' | 'unused_points'  -- NEW (default: unused_points)
  }
  branding_colors: JSONB
  branding_assets: JSONB
  branding_fonts: JSONB
  branding_borders: JSONB
  created_at: timestamp
  updated_at: timestamp
}
```

#### templates
```sql
templates {
  id: string (UUID)
  program_id: string
  pass_kind: 'loyalty' | 'rewards'  -- CHANGED from pass_type (v0.3.1)
  version: number
  apple_template: JSONB
  google_template: JSONB
  fields_mapping: JSONB
  is_active: boolean
  created_at: timestamp
  updated_at: timestamp
}
```

## 🔧 Key Integrations

### Perk API Integration
- **File**: `/src/lib/perk-client.ts`
- **Features**: Retry logic, rate limiting, error handling
- **Methods**: CRUD operations for participants
- **Validation**: Zod schemas for all responses

### Webhook Processing
- **Endpoint**: `/api/webhooks/perk/{programId}`
- **Features**: Idempotency, full event tracking
- **Processing**: ParticipantSnapshot normalization
- **Notification**: Auto-queue for points_updated events

### Pass Generation
- **Apple**: `/src/lib/apple-pass.ts`
- **Google**: `/src/lib/google-wallet.ts`
- **Interface**: Both use ParticipantSnapshot
- **Configuration**: Respects program points_display setting

## 🏷️ Merge Tag Reference

### Participant Data Tags
- `{points}` - Total lifetime points
- `{unused_points}` - Available balance
- `{tier}` - Tier (with status fallback)
- `{status}` - Participant status
- `{email}` - Email address
- `{fname}` - First name
- `{lname}` - Last name
- `{full_name}` - Combined first + last name

### Program Tags
- `{program_name}` - Program name

### Dynamic Profile Tags
- `{profile.*}` - Any profile attribute (e.g., `{profile.seat_section}`)

### Notification-Specific Tags
- `{points_delta}` - Points change amount (+/-)
- `{new_points}` - New balance after change

## 🧪 Testing Features

### Admin Testing Tools
- **Location**: `/admin/participants/[perk_uuid]`
- **Feature**: Simulate Points Burst
- **Access**: super_admin, program_admin (dev only)
- **Configuration**: Events, points per event, duration
- **Monitoring**: Real-time via Jobs page

### Unit Tests
- **Normalization**: `/src/lib/__tests__/perk-normalize.test.ts`
- **Merge Tags**: `/src/lib/__tests__/merge-tags.test.ts`
- **Notifications**: `/src/lib/__tests__/notify.test.ts`
- **Fixtures**: `tests/fixtures/perk-participant-bluejackets.json`

## 🔐 Security Model

### Authentication
- **Method**: JWT cookies (emulator)
- **Storage**: Signed, HTTP-only cookies
- **TTL**: 24 hours
- **Secret**: `APP_EMULATOR_SECRET` environment variable

### Authorization
- **Levels**: 5 roles with hierarchical permissions
- **Enforcement**: Server-side checks on all actions
- **Scoping**: Program-based data isolation
- **API Keys**: Never sent to client (server-side only)

### Data Protection
- **Secrets**: Environment variables only
- **API Keys**: Masked in UI, server-side operations
- **Webhook Secrets**: Removed from storage (v0.2.0)
- **Input Validation**: Zod schemas throughout

## 📈 Performance Features

### Notification Optimization
- **Merge Window**: 120 seconds for rapid events
- **Throttling**: 300 seconds per participant+rule
- **Buffering**: In-memory with automatic flush
- **Background Processing**: Separate flush service

### Database Optimization
- **Indexes**: On participant lookup fields
- **Scoping**: Program-based filtering
- **Caching**: Component-level data caching
- **Batch Operations**: Optimized for multi-participant updates

## 🚀 Deployment Information

### Version Tracking
- **Component**: `version-indicator.tsx`
- **Location**: Bottom-right of admin interface
- **Data**: Git commit hash or 'dev'
- **Purpose**: Verify deployment status

### Environment Configuration
```bash
# Core Requirements
APP_EMULATOR_SECRET=your-secure-secret
NEXT_PUBLIC_APP_URL=https://pass.perk.ooo
PERK_API_URL=https://api.getperk.com
PERK_API_KEY=your-perk-api-key

# Database
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Wallet Configuration
APPLE_TEAM_IDENTIFIER=your-apple-team-id
APPLE_PASS_TYPE_IDENTIFIER=pass.com.yourcompany.loyalty
GOOGLE_WALLET_ISSUER_ID=your-google-issuer-id
```

### Current Status
- **Version**: v0.3.1
- **Deployment**: Vercel (https://pass.perk.ooo)
- **Branch**: main (auto-deploy)
- **Build Status**: ✅ Passing
- **TypeScript**: ✅ No errors

---

**Last Updated**: 2025-08-12
**Next Release**: v0.4.0 (Template Studio Data Mapping Drawer)

For detailed implementation notes, see [CLAUDE.md](./CLAUDE.md)
For version history, see [CHANGELOG.md](./CHANGELOG.md)
For user documentation, see [README.md](./README.md)