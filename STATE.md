# Perk Wallet - Current State

**Last Updated**: 2025-01-14  
**Production URL**: https://pass.perk.ooo  
**Latest Commit**: 2cfe6d8

## Major Features

### Admin Interface & RBAC
- **Complete admin dashboard** with role-based permissions at `/admin`
- **5 Role system**: super_admin, program_admin, program_editor, program_viewer, support
- **JWT-based emulator** for role impersonation (requires `APP_EMULATOR_SECRET`)
- **Multi-program architecture** with program-scoped data access

### Admin Pages
- **Dashboard**: System KPIs and real-time monitoring
- **Programs**: Multi-program management with status control (draft/active/inactive)
- **Templates**: JSON editor with Zod validation and versioning
- **Participants**: Search, points management, pass reissuance
- **Passes**: Wallet pass management and sync status
- **Jobs**: Background job monitoring with retry capabilities
- **Webhooks**: Event history with payload inspection and cURL generation
- **Diagnostics**: System health checks and Apple Wallet certificate validation

### Wallet Pass System
- **Apple Wallet**: Full `.pkpass` generation with certificate signing
- **Google Wallet**: Complete integration with service accounts
- **Dynamic content**: 16+ merge tags for personalization
- **Multi-platform**: Simultaneous Apple and Google pass creation

### Program-Level Theming
- **CSS Variables**: Dynamic theme injection per program
- **Google Fonts**: Dynamic font loading and management
- **Branding Page**: Live preview editor for colors, fonts, borders, assets
- **File Upload**: Supabase Storage integration for brand assets
- **Theme Doctor**: Diagnostic page for QA testing

### Notification System
- **Intelligent merging**: 120-second window for rapid point updates
- **Throttling**: 300-second cooldown per participant+rule
- **Points delta calculation**: Using program-specific display settings
- **Event types**: manual, points_updated, reward_earned, location_enter

### Perk API Integration
- **Comprehensive data alignment** with Zod validation
- **Webhook processing**: Idempotent event handling with program context
- **API validation**: Real-time program setup verification
- **ParticipantSnapshot interface**: Normalized data model with tier fallbacks

### Developer Tools
- **Points Burst Simulator**: Testing tool for notification systems
- **Apple Doctor**: Certificate and signing diagnostics
- **Version indicator**: Git commit tracking in UI
- **CLI commands**: `pnpm doctor`, `pnpm apple:doctor`

## Database Schema

### Core Tables
```sql
programs:
  id, program_id, name, api_key, webhook_secret,
  settings (status, points_display, branding config),
  branding_* (fonts, colors, assets, borders),
  apple_pass_type_id, google_wallet_class_id

templates:
  id, program_id, pass_type, version, is_active,
  apple_template, google_template, fields_mapping

participants:
  id, perk_uuid, program_id, email, perk_participant_id,
  points, unused_points, tier, status, fname, lname,
  profile_attributes, webhook tracking fields

passes:
  id, participant_id, program_id, pass_type,
  apple_serial_number, google_object_id,
  pass_data, data_hash, version

jobs:
  id, type, status, payload, result, error,
  attempts, scheduling fields

webhook_events:
  id, program_id, event_type, event_id,
  participant data, event_data, processed_at
```

## Environment Variables

### Required
```bash
# Database
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Perk API
PERK_API_KEY
PERK_WEBHOOK_SECRET

# Security
QR_SIGNING_SECRET
APP_EMULATOR_SECRET

# Apple Wallet
APPLE_PASS_TYPE_IDENTIFIER
APPLE_TEAM_IDENTIFIER
APPLE_WEB_SERVICE_URL
APPLE_AUTH_TOKEN_SECRET
APPLE_PASS_CERT_P12_BASE64
APPLE_PASS_CERT_PASSWORD

# Google Wallet
GOOGLE_WALLET_ISSUER_ID
GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL
GOOGLE_WALLET_SERVICE_ACCOUNT_KEY
```

### Optional
```bash
PERK_API_URL=https://perk.studio
PERK_BASE_URL
NEXT_PUBLIC_APP_URL=https://pass.perk.ooo
APPLE_DOCTOR_DEBUG
```

## Open TODOs

### High Priority
- **Notification delivery**: Replace mock with actual email/push implementation
- **Real authentication**: Replace emulator with production auth system
- **Template updates**: Server-side template update API

### Technical Debt
- Comprehensive error tracking (Sentry)
- Audit logging for admin actions
- End-to-end testing for admin workflows
- Database backup strategy
- API documentation for webhooks

## Key Dependencies
- **Framework**: Next.js 15.4.6, React 19
- **Database**: Supabase PostgreSQL
- **Validation**: Zod 4.0.17
- **Wallet**: passkit-generator 3.4.0, google-auth-library 10.2.1
- **UI**: Radix UI, Tailwind CSS 3.4.0
- **Crypto**: jose 6.0.12, node-forge 1.3.1

## Deployment Status
- **Platform**: Vercel (auto-deploy from main)
- **Region**: US East (iad1)
- **Admin Access**: `/admin/emulator` → impersonate → `/admin`
- **Multi-tenant**: Program-scoped permissions and data
- **Build Status**: ✅ Fixed and production-ready