# Perk Wallet MVP

A Next.js application for issuing and managing Apple Wallet and Google Wallet passes for Perk loyalty programs with full multi-program support.

## Features

- **Multi-Program Architecture**: Complete data isolation and branding per program
- **Dual Pass Issuance**: Issues both Loyalty and My Rewards passes grouped together
- **QR Code Generation**: Signed QR codes with HMAC-SHA256 and 180-second TTL
- **Universal Magic Links**: `https://pass.perk.ooo/w/{programId}/{perkUuid}`
- **Per-Program Webhooks**: Individual webhook endpoints with comprehensive event tracking
- **Program Branding**: Customizable fonts, colors, assets, and borders per program
- **Event Tracking**: Complete audit trail of all webhook events with program context
- **API Resilience**: Automatic retry with exponential backoff and 429 rate limit handling
- **Real-time Sync**: Updates passes within 60 seconds (p95) of Perk events

## Tech Stack

- **Framework**: Next.js 14 App Router with TypeScript
- **Database**: Supabase Postgres
- **Deployment**: Vercel
- **Runtime**: Node 20
- **Wallet Libraries**: passkit-generator (Apple), Google Wallet REST API
- **Validation**: Zod
- **Authentication**: Jose (JWT)

## Prerequisites

- Node.js 20+
- pnpm package manager
- Supabase account
- Apple Developer account (for Apple Wallet)
- Google Cloud account (for Google Wallet)
- Perk API credentials

## Setup

### 1. Clone and Install

```bash
git clone https://github.com/your-org/perk-wallet.git
cd perk-wallet
pnpm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:
- `PERK_API_URL`: Perk API base URL (default: https://perk.studio)
- `PERK_API_KEY`: Your Perk program API key
- `PERK_WEBHOOK_SECRET`: Secret for webhook signature verification
- `SUPABASE_*`: Supabase project credentials
- `QR_SIGNING_SECRET`: Secret for QR code signing
- `APPLE_*`: Apple Wallet configuration
- `GOOGLE_*`: Google Wallet configuration

### 3. Database Setup

Run the Supabase migrations to create the required tables:

```bash
npx supabase db push
```

Or manually run the SQL migrations:
- `supabase/migrations/001_initial_schema.sql` - Core schema
- `supabase/migrations/002_multi_program_support.sql` - Multi-program features

### 4. Apple Wallet Setup

1. Create a Pass Type ID in Apple Developer Console
2. Generate signing certificates
3. Add certificates to environment:
   - `APPLE_WWDR_CERT`: Apple WWDR certificate
   - `APPLE_SIGNER_CERT`: Your signing certificate
   - `APPLE_SIGNER_KEY`: Your private key

### 5. Google Wallet Setup

1. Enable Google Wallet API in Google Cloud Console
2. Create a service account
3. Add service account credentials to `GOOGLE_WALLET_SERVICE_ACCOUNT_KEY`

## Development

```bash
pnpm dev
```

Visit http://localhost:3000

### Admin Interface

The application includes a comprehensive admin interface with role-based access control:

```bash
# Visit the admin interface
http://localhost:3000/admin
```

#### Admin + Role Emulator

For development and testing, the admin interface uses a role emulator that allows you to simulate different user roles without real authentication.

##### Setup

1. **Set Emulator Secret** (required):
   ```bash
   # Add to your .env.local
   APP_EMULATOR_SECRET=your-secure-secret-key-here
   ```

2. **Access Admin Emulator**:
   Visit `/admin/emulator` to set your role and program context

##### Available Roles

- **super_admin**: Full access across all programs
- **program_admin**: Full access within assigned program(s)  
- **program_editor**: Edit templates, manage passes, send notifications (no secrets access)
- **program_viewer**: Read-only access
- **support**: Limited write access (reissue passes, resend install links)

##### Admin Features

**Dashboard** (`/admin`)
- System KPIs and health metrics
- Program-specific or cross-program statistics
- Real-time activity monitoring

**Programs** (`/admin/programs`)
- List all programs (super_admin) or assigned program
- Program configuration and branding editor
- API key management (server-side only for security)

**Templates** (`/admin/templates`)
- JSON editor for Apple Wallet and Google Wallet templates
- Template versioning with "Bump Version" functionality
- Zod validation for template schemas

**Participants** (`/admin/participants`)
- Search participants by email or UUID
- View participant details, points, and tier status
- Actions: Reissue passes, resend Magic Install links

**Passes** (`/admin/passes`)
- View all wallet passes with sync status
- Force update passes or expire them
- Error monitoring and troubleshooting

**Jobs** (`/admin/jobs`)
- Monitor background job execution
- View job payloads and error details
- Retry failed jobs with permission checks

**Webhooks** (`/admin/webhooks`)
- View webhook event history
- Pretty-print event payloads
- Generate cURL commands for event replay

##### Security Features

- **Server-side permission checks**: All admin actions verify permissions server-side
- **Secret redaction**: API keys are never sent to client, only server-side copy actions
- **Signed JWT cookies**: Emulator uses cryptographically signed identity tokens
- **Role-based UI**: Interface adapts based on user permissions

##### Switching Programs

Non-super-admin roles are scoped to specific programs. Super admins can:
- View "All Programs" or scope to a specific program
- Switch program context via the top bar program switcher

##### Production Deployment

When deploying to production:
1. The emulator requires `APP_EMULATOR_SECRET` to be set
2. Without the secret, a warning banner appears with degraded security
3. The emulator can be disabled by implementing real authentication
4. All admin routes are protected by middleware

##### Development Workflow

```bash
# 1. Set your emulator secret
echo "APP_EMULATOR_SECRET=dev-secret-123" >> .env.local

# 2. Start development server
pnpm dev

# 3. Visit admin emulator
open http://localhost:3000/admin/emulator

# 4. Choose role (e.g., super_admin) and optionally select program

# 5. Access admin interface
# You'll be redirected to /admin with your selected role
```

The admin interface provides a complete management experience while maintaining security through proper permission checks and server-side validation.

## API Endpoints

### Webhooks
- `POST /api/webhooks/perk/{programId}` - Per-program webhook endpoints
- `GET /api/debug` - Database status and program statistics

### Pass Management
- `POST /api/passes/issue` - Issue new passes for a participant
- `PATCH /api/passes/[perk_uuid]` - Update existing passes
- `POST /api/passes/[perk_uuid]/notify` - Send push notifications

### Installation
- `GET /w/{programId}/{perkUuid}` - Universal magic link page
- `POST /api/install-token` - Generate installation tokens

### Apple Wallet Web Service
- `POST /api/apple/register` - Register device
- `DELETE /api/apple/unregister` - Unregister device
- `GET /api/apple/passes` - Get updated passes
- `POST /api/apple/log` - Log errors

## Testing

Run tests with Vitest:

```bash
pnpm test
```

Key test coverage:
- QR code signing and verification
- API retry logic with 429 backoff
- Webhook idempotency
- Pass generation

## Deployment

### Vercel

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy:

```bash
vercel --prod
```

### Database

Ensure Supabase database is accessible from your deployment environment.

## Multi-Program Architecture

### Program Isolation

Each program operates independently with:
- Separate participant databases
- Individual webhook endpoints
- Isolated event tracking
- Custom branding configuration

### Program Branding

Programs support comprehensive branding configuration:

```typescript
{
  branding_fonts: {
    header_font: "Inter",
    body_font: "Inter"
  },
  branding_colors: {
    brand_color: "#000000",
    brand_text_color: "#FFFFFF",
    secondary_color: "#666666",
    // ... additional color options
  },
  branding_assets: {
    logo_url: "https://example.com/logo.png",
    hero_background_image_url: "https://example.com/hero.jpg",
    // ... additional assets
  },
  branding_borders: {
    button_border_radius: "Medium",
    input_border_radius: "Medium",
    tiles_border_radius: "Medium",
    cards_border_radius: "Medium"
  }
}
```

### Event Tracking

All webhook events are tracked in the `webhook_events` table with:
- Full program context
- Participant association
- Event type classification
- Complete event data payload
- Idempotency keys for duplicate prevention

## Webhook Events

The system handles Perk webhook events via per-program endpoints:

### Webhook Endpoint

```
POST /api/webhooks/perk/{programId}
```

Where `{programId}` is the numeric Perk program ID (e.g., 44 for Buckeye Nation Rewards).

### Supported Events

- `participant_created`: Creates participant record and issues passes
- `participant_points_updated`: Syncs points and updates loyalty pass  
- `challenge_completed`: Refreshes participant data and awards points
- `reward_earned`: Updates My Rewards pass and sends notification
- Custom events: All event types are tracked and logged

### Webhook Examples

#### Live Production Example (Buckeye Nation Rewards)
```bash
curl -i -X POST https://pass.perk.ooo/api/webhooks/perk/44 \
  -H "Content-Type: application/json" \
  -d '{"event":"participant_points_updated","data":{"participant":{"id":140699,"email":"user@example.com","points":1350,"unused_points":1350}}}'
```

#### Participant Created
```bash
curl -i -X POST https://pass.perk.ooo/api/webhooks/perk/44 \
  -H "Content-Type: application/json" \
  -d '{"event":"participant_created","data":{"participant":{"id":140700,"email":"newuser@example.com","points":0}}}'
```

#### Challenge Completed
```bash
curl -i -X POST https://pass.perk.ooo/api/webhooks/perk/44 \
  -H "Content-Type: application/json" \
  -d '{"event":"challenge_completed","data":{"participant":{"id":140699,"email":"user@example.com","points":1550},"challenge":{"id":10001491,"points":200,"challenge_type":"signup"}}}'
```

#### Reward Earned
```bash
curl -i -X POST https://pass.perk.ooo/api/webhooks/perk/44 \
  -H "Content-Type: application/json" \
  -d '{"event":"reward_earned","data":{"participant":{"id":140699,"email":"user@example.com"},"reward":{"id":669,"name":"character blanket","selection":"redeem"}}}'
```

## Pass Structure

### Loyalty Pass
- Primary field: Points balance
- Secondary field: Tier status
- Grouped by program ID
- QR code with signed participant UUID

### My Rewards Pass
- Primary field: Available rewards count
- Secondary field: Active status
- Grouped with loyalty pass
- Same QR code as loyalty pass

## Security

- Webhook signatures verified with HMAC-SHA256
- QR codes signed with TTL validation
- API keys stored securely in environment
- No secrets stored in Perk profile attributes

## Monitoring

Key metrics to monitor:
- Webhook processing latency per program
- Pass update success rate
- API rate limit hits
- QR code verification failures
- Program statistics via `/api/debug` endpoint

### Debug Endpoint

The `/api/debug` endpoint provides comprehensive system status:

```bash
curl https://pass.perk.ooo/api/debug
```

Returns:
- Database connection status
- Program configurations with branding
- Recent participants and webhook events
- Program statistics (participant count, event count, last activity)
- Multi-program status confirmation

## Support

For issues and questions:
- GitHub Issues: [your-repo/issues]
- Documentation: [docs-link]
- Perk API Docs: https://perk.studio/docs

## Version History

### Latest: v0.2.0 (2025-08-12)
- Complete Admin Interface with Role-Based Access Control
- Program Management System with API validation
- Status management (draft/active/inactive)
- Real-time Supabase data integration
- Version indicator for deployment tracking
- 7 admin pages: Dashboard, Programs, Templates, Participants, Passes, Jobs, Webhooks
- Multi-tenant architecture fully implemented

### v0.1.0 (Initial Release)
- Core pass issuance functionality
- Webhook processing
- QR code generation
- Magic links

---
Last updated: 2025-08-12 - See CLAUDE.md for detailed implementation notes
