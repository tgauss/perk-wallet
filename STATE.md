# Perk Wallet - Current State

**Last Updated**: 2025-08-15  
**Production URL**: https://pass.perk.ooo  
**Latest Version**: v0.6.0
**Identity Model**: Locked ✅

## Major Features (v0.6.0 Status)

### ✅ Identity Model Locked

- **Composite key architecture**: `(program_id UUID, perk_participant_id bigint)`
- **Dual addressing**: Perk Program IDs at edges, UUIDs internal
- **Program resolver**: Automatic bridging between public/internal identifiers
- **Admin short routes**: `/admin/p/44` → `/admin/programs/{uuid}`
- **QR grammar**: `44.246785.loyalty[.resourceType.resourceId]`

### ✅ Diagnostics and Install Routes Green

- **Diagnostics API**: POST `/api/admin/diagnostics/install` fully operational
- **Install routes**: `/w/44/246785` verified end-to-end for program 44
- **Participant validation**: Composite key lookups working
- **Certificate validation**: Apple/Google readiness checks passing
- **QR preview generation**: Correct format `44.246785.loyalty`

### ✅ Templates v1 Published (Program 44)

- **Loyalty template**: Published and active
- **Rewards template**: Published and active
- **Asset system**: 5 asset types with Supabase Storage
- **Merge tags**: 16+ dynamic content tags validated
- **Preview API**: Real participant data resolution working

### ✅ Theme System and Branding Admin Live

- **Program-level theming**: CSS variables per program
- **Google Fonts integration**: Dynamic font loading
- **Branding editor**: Live preview with colors, fonts, borders, assets
- **File upload**: Supabase Storage integration
- **Theme Doctor**: Diagnostics for QA testing

### ✅ Template Editor with Merge Tags and Preview API Live

- **Multi-tab editor**: Layout, Fields, Assets, Preview tabs
- **Syntax highlighting**: JSON editor with validation
- **Asset management**: Upload, replace, remove workflow
- **Field mapping**: Visual editor with autocomplete
- **Real-time preview**: API-driven with participant data

### 🔄 Live Device Previews: Planned

- **Apple Wallet frames**: Real iOS wallet UI rendering
- **Google Wallet frames**: Android wallet UI rendering
- **Device simulation**: iPhone/Android device previews
- **Interactive preview**: Tap/swipe gesture support

### ⚠️ Wallet Provider Credentials: Pending

- **Apple certificates**: Configuration ready, credentials needed per deployment
- **Google service accounts**: Configuration ready, credentials needed per deployment
- **Certificate validation**: Diagnostics detect missing/invalid credentials
- **Graceful degradation**: System works without credentials (passes fail to issue)

## Database Schema (v0.6.0)

### Core Tables

```sql
-- Identity model with composite keys
participants (
  program_id UUID,
  perk_participant_id BIGINT,
  PRIMARY KEY (program_id, perk_participant_id)
)

passes (
  program_id UUID,
  perk_participant_id BIGINT,
  FOREIGN KEY (program_id, perk_participant_id)
    REFERENCES participants(program_id, perk_participant_id)
)

-- Program management
programs (
  id UUID PRIMARY KEY,
  perk_program_id INTEGER UNIQUE,  -- For public routes
  settings JSONB  -- status, points_display, default_install_group
)

-- Template system
templates (
  pass_kind TEXT,  -- Standardized from pass_type
  version INTEGER,
  is_active BOOLEAN
)

template_drafts (
  program_id UUID,
  pass_kind TEXT,
  layout JSONB,
  assets JSONB
)
```

### Migration Status

- ✅ **Composite primary keys**: Participants use (program_id, perk_participant_id)
- ✅ **perk_uuid removal**: All references eliminated from codebase
- ✅ **Foreign key constraints**: Passes properly reference participants
- ✅ **Schema consistency**: templates.pass_kind aligned with passes.pass_kind

## API Status

### ✅ Public Routes (Using Perk Program IDs)

```bash
GET /w/44/246785                    # Default install group
GET /w/44/246785/loyalty           # Specific pass kind
GET /w/44/246785/loyalty/location/store-123  # Resource context
```

### ✅ Admin Routes (UUID-based with Resolver)

```bash
GET /admin/p/44                     # Redirects to UUID route
GET /admin/programs/{uuid}          # Internal admin routes
GET /admin/programs/{uuid}/branding # Branding editor
GET /admin/programs/{uuid}/templates # Template management
```

### ✅ API Endpoints

```bash
POST /api/admin/diagnostics/install # System health checks
POST /api/webhooks/perk/44         # Per-program webhooks
PATCH /api/passes/44/246785        # Pass management
POST /api/admin/templates/preview  # Template preview
```

## Technical Architecture

### Identity Resolution Pattern

```typescript
// Resolver handles both UUID and Perk Program ID
const resolved = await resolveProgram(44);
// → { program: { id: "uuid", perk_program_id: 44 }, reason: "by_perk_id" }

// Admin routes use UUIDs internally
/admin/programs/3648cab8-a29f-4d13-9160-f1eab36e88bd

// Public routes use Perk Program IDs
/w/44/246785
```

### Multi-Tenant Security

- **Program scoping**: All queries filtered by program_id
- **Role-based access**: 5 roles with program-specific permissions
- **Data isolation**: Complete separation between programs
- **UUID obscurity**: Internal IDs not exposed in public APIs

### Template System Architecture

- **Draft management**: Program-scoped template editing
- **Asset storage**: Organized Supabase Storage structure
- **Merge tag resolution**: 16+ dynamic content tags
- **Preview system**: Real participant data integration

## Development Status

### Current Sprint Focus

- **Documentation completion**: Comprehensive guides for new engineers
- **Developer onboarding**: README overhaul, setup instructions
- **Operational procedures**: Admin tasks, troubleshooting, monitoring

### Immediate Next Steps (v0.6.1+)

1. **Live device previews**: Apple/Google wallet frame rendering
2. **Template publishing workflow**: Draft → template promotion
3. **Pass regeneration**: Auto-update passes when templates change
4. **Apple class creation**: Auto-generate Apple pass classes

### Technical Debt

- **Real authentication**: Replace emulator with production auth
- **Error tracking**: Implement Sentry for production monitoring
- **Audit logging**: Track admin actions for compliance
- **E2E testing**: Automated testing for critical user flows

## Deployment Status

### Production Environment

- **Platform**: Vercel (auto-deploy from main branch)
- **Region**: US East (iad1)
- **Domain**: https://pass.perk.ooo
- **SSL**: Automated via Vercel
- **CDN**: Global edge network

### Admin Access

- **Emulator**: `/admin/emulator` for role selection
- **Secret required**: `APP_EMULATOR_SECRET` environment variable
- **Roles available**: super_admin, program_admin, program_editor, program_viewer, support
- **Security**: JWT-based identity with server-side permission checks

### Monitoring

- **Health checks**: `/api/admin/doctor` endpoint
- **Version tracking**: Git commit hash display in UI
- **Error handling**: Comprehensive error boundaries
- **Performance**: Sub-2s install route response times

## Known Limitations

### Certificate Dependencies

- **Apple Wallet**: Requires valid .p12 certificate and password
- **Google Wallet**: Requires service account with proper permissions
- **Development**: Can test without certificates (passes fail gracefully)
- **Production**: Certificates required for functional wallet passes

### Notification System

- **Merging implemented**: 120s merge window for rapid updates
- **Throttling implemented**: 300s cooldown per participant+rule
- **Delivery pending**: Push notification delivery not yet implemented
- **Buffer system**: In-memory notification buffering operational

### Template Publishing

- **Draft system**: Fully operational for editing
- **Publishing workflow**: UI placeholder, backend pending
- **Version management**: Template versioning system designed but not implemented
- **Impact analysis**: Show affected passes before publishing (planned)

## Success Metrics (v0.6.0)

### Identity Model Verification

- ✅ **Diagnostics passing**: All health checks green for program 44
- ✅ **Install routes working**: `/w/44/246785` returns 200 with proper response
- ✅ **Admin redirect functional**: `/admin/p/44` properly redirects to UUID route
- ✅ **No UUID exposure**: Public APIs use only Perk Program IDs
- ✅ **Composite key queries**: All database operations use proper composite keys

### System Health

- ✅ **Build status**: Zero compilation errors
- ✅ **Test coverage**: All critical identity functions tested
- ✅ **Database integrity**: Foreign key constraints enforced
- ✅ **API consistency**: All routes use resolver pattern
- ✅ **Admin functionality**: Full RBAC and program management operational

## Environment Requirements

### Required Variables (All Environments)

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Security
QR_SIGNING_SECRET
APP_EMULATOR_SECRET

# Perk Integration
PERK_API_KEY
PERK_WEBHOOK_SECRET
```

### Conditional Variables (Per Feature)

```bash
# Apple Wallet (optional, passes fail gracefully if missing)
APPLE_PASS_TYPE_IDENTIFIER
APPLE_TEAM_IDENTIFIER
APPLE_PASS_CERT_P12_BASE64
APPLE_PASS_CERT_PASSWORD

# Google Wallet (optional, passes fail gracefully if missing)
GOOGLE_WALLET_ISSUER_ID
GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL
GOOGLE_WALLET_SERVICE_ACCOUNT_KEY
```

---

**Next Version Target**: v0.6.1 (Documentation release)  
**Next Feature Target**: v0.7.0 (Live device previews + template publishing)  
**Production Readiness**: ✅ Ready with proper certificate configuration
