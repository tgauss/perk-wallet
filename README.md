# Perk Wallet MVP

A Next.js application for issuing and managing Apple Wallet and Google Wallet passes for Perk loyalty programs.

## Features

- **Dual Pass Issuance**: Issues both Loyalty and My Rewards passes grouped together
- **QR Code Generation**: Signed QR codes with HMAC-SHA256 and 180-second TTL
- **Universal Magic Links**: `https://pass.perk.ooo/w/{programId}/{perkUuid}`
- **Webhook Processing**: Handles Perk events with idempotency
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

Run the Supabase migration to create the required tables:

```bash
npx supabase db push
```

Or manually run the SQL in `supabase/migrations/001_initial_schema.sql`

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

## API Endpoints

### Webhooks
- `POST /api/webhooks/perk` - Receives Perk webhook events

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

## Webhook Events

The system handles these Perk webhook events via per-program endpoints:

### Webhook Endpoint

```
POST /api/webhooks/perk/{programId}
```

Where `{programId}` is the numeric Perk program ID.

### Supported Events

- `participant_created`: Creates participant record and issues passes
- `participant_points_updated`: Syncs points and updates loyalty pass
- `challenge_completed`: Refreshes participant data and awards points
- `reward_earned`: Updates My Rewards pass and sends notification

### Webhook Examples

#### Participant Created
```bash
curl -i -X POST http://localhost:3000/api/webhooks/perk/1000026 \
  -H "Content-Type: application/json" \
  -d '{"event":"participant_created","data":{"participant":{"id":10262159,"email":"test@example.com"}}}'
```

#### Participant Points Updated
```bash
curl -i -X POST http://localhost:3000/api/webhooks/perk/1000026 \
  -H "Content-Type: application/json" \
  -d '{"event":"participant_points_updated","data":{"participant":{"id":10262159,"email":"test@example.com","points":700}}}'
```

#### Challenge Completed
```bash
curl -i -X POST http://localhost:3000/api/webhooks/perk/1000026 \
  -H "Content-Type: application/json" \
  -d '{"event":"challenge_completed","data":{"participant":{"id":10262159,"email":"test@example.com"},"challenge":{"id":10001491,"points":200,"challenge_type":"signup"}}}'
```

#### Reward Earned
```bash
curl -i -X POST http://localhost:3000/api/webhooks/perk/1000026 \
  -H "Content-Type: application/json" \
  -d '{"event":"reward_earned","data":{"participant":{"id":247076,"email":"test@example.com"},"reward":{"id":669,"name":"character blanket","selection":"redeem"}}}'
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
- Webhook processing latency
- Pass update success rate
- API rate limit hits
- QR code verification failures

## Support

For issues and questions:
- GitHub Issues: [your-repo/issues]
- Documentation: [docs-link]
- Perk API Docs: https://perk.studio/docs
