# Routes Reference

Complete API and route documentation for Perk Wallet.

## Public Routes

### Install Routes (Universal Magic Links)

#### Base Install Route

```http
GET /w/{perkProgramId}/{perkParticipantId}
```

Issues default pass group (usually loyalty + rewards) for participant.

**Example:**

```bash
curl https://pass.perk.ooo/w/44/246785
```

**Response:**

```json
{
  "ok": true,
  "program": "Buckeye Nation Rewards",
  "installed": [
    {
      "passKind": "loyalty",
      "status": "success",
      "detail": "Pass issued successfully"
    },
    {
      "passKind": "rewards",
      "status": "success",
      "detail": "Pass issued successfully"
    }
  ]
}
```

#### Specific Pass Kind

```http
GET /w/{perkProgramId}/{perkParticipantId}/{passKind}
```

Issues specific pass type only.

**Parameters:**

- `passKind`: `loyalty` | `rewards` | `coupon` | `ticket` | `stamp` | `giftcard` | `id`

**Example:**

```bash
curl https://pass.perk.ooo/w/44/246785/loyalty
```

#### Resource-Specific Install

```http
GET /w/{perkProgramId}/{perkParticipantId}/{passKind}/{resourceType}/{resourceId}
```

Issues pass with specific resource context (for QR code scans).

**Example:**

```bash
curl https://pass.perk.ooo/w/44/246785/loyalty/location/store-123
```

### Apple Wallet Web Service

#### Get Pass Update

```http
GET /api/apple-web-service/v1/passes/{passTypeIdentifier}/{serialNumber}
```

Returns updated `.pkpass` file if pass has changes.

#### Device Registration

```http
POST /api/apple-web-service/v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
DELETE /api/apple-web-service/v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
```

Register/unregister device for pass updates.

#### Error Logging

```http
POST /api/apple-web-service/v1/log
```

Accepts error logs from iOS devices.

## Admin Routes

### Short Routes (Perk Program ID → UUID)

#### Program Redirect

```http
GET /admin/p/{perkProgramId}
```

Redirects to UUID-based admin route.

**Example:**

```bash
curl -I https://pass.perk.ooo/admin/p/44
# → 307 https://pass.perk.ooo/admin/programs/3648cab8-a29f-4d13-9160-f1eab36e88bd
```

### Core Admin Pages

#### Dashboard

```http
GET /admin
```

System overview with KPIs and activity monitoring.

#### Programs Management

```http
GET /admin/programs                    # List programs
GET /admin/programs/{programId}        # Program details
GET /admin/programs/{programId}/branding          # Branding editor
GET /admin/programs/{programId}/templates        # Template management
GET /admin/programs/{programId}/diagnostics      # Health checks
GET /admin/programs/new                # Create program
```

#### Template Studio

```http
GET /admin/templates                   # Template drafts list
GET /admin/programs/{programId}/templates/{draftId}  # Template editor
```

#### Participant Management

```http
GET /admin/participants                # Legacy redirect (moved to program context)
GET /admin/programs/{programId}/participants/{perkParticipantId}  # Participant details (composite key)
```

#### Operations

```http
GET /admin/passes                      # Wallet pass monitoring
GET /admin/jobs                        # Background job status
GET /admin/webhooks                    # Event history
```

#### Development Tools

```http
GET /admin/apple-check                 # Apple Wallet diagnostics
GET /admin/doctor                      # System health check
GET /admin/theme-check                 # Branding validation
```

### Authentication (Emulator)

```http
GET /admin/emulator                    # Role selection
POST /api/admin/emulator/set-identity  # Set role
POST /api/admin/emulator/clear-identity # Clear role
```

## API Routes

### Diagnostics

#### Install Diagnostics

```http
POST /api/admin/diagnostics/install
```

Comprehensive system health check.

**Request:**

```json
{
  "perk_program_id": 44,
  "perk_participant_id": 246785,
  "kinds": ["loyalty", "rewards"]
}
```

**Response:**

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

#### System Doctor

```http
GET /api/admin/doctor?program_id={perkProgramId}
```

Environment and configuration validation.

### Webhook Processing

#### Perk Webhooks (Per-Program)

```http
POST /api/webhooks/perk/{perkProgramId}
```

Receives events from Perk platform.

**Headers:**

```
Content-Type: application/json
Perk-Signature: sha256=<HMAC-SHA256>
```

**Example Events:**

```json
// Participant created
{
  "event": "participant_created",
  "data": {
    "participant": {
      "id": 246785,
      "email": "user@example.com",
      "points": 0,
      "unused_points": 0
    }
  }
}

// Points updated
{
  "event": "participant_points_updated",
  "data": {
    "participant": {
      "id": 246785,
      "points": 150,
      "unused_points": 150
    }
  }
}

// Reward earned
{
  "event": "reward_earned",
  "data": {
    "participant": {
      "id": 246785,
      "email": "user@example.com"
    },
    "reward": {
      "id": 669,
      "name": "Free Coffee",
      "selection": "redeem"
    }
  }
}
```

### Pass Management

#### Update Pass

```http
PATCH /api/passes/{perkProgramId}/{perkParticipantId}
```

Force update wallet passes with latest data.

**Request:**

```json
{
  "points": 150,
  "tier": "Gold"
}
```

#### Issue Passes

```http
POST /api/passes/issue
```

Create new wallet passes for participant.

**Request:**

```json
{
  "program_id": "3648cab8-a29f-4d13-9160-f1eab36e88bd",
  "perk_participant_id": 246785,
  "kinds": ["loyalty", "rewards"]
}
```

### Template Preview

#### Preview Template

```http
POST /api/admin/templates/preview
```

Resolve template with participant data.

**Request:**

```json
{
  "program_id": "3648cab8-a29f-4d13-9160-f1eab36e88bd",
  "draft_id": "draft-uuid-here",
  "participant": {
    "perk_participant_id": 246785
  }
}
```

**Response:**

```json
{
  "resolved_layout": {
    "headerFields": [
      {
        "label": "Balance",
        "value": "750 points" // {unused_points} resolved
      }
    ]
  }
}
```

### Development APIs

#### Simulate Points Burst

```http
POST /api/dev/simulate/points-burst
```

Testing tool for notification merging.

**Request:**

```json
{
  "program_id": "3648cab8-a29f-4d13-9160-f1eab36e88bd",
  "perk_participant_id": 246785,
  "totalEvents": 5,
  "deltaPerEvent": 10,
  "durationSec": 60
}
```

#### Install Token Generation

```http
POST /api/install-token
```

Generate tokens for Magic Install links.

**Request:**

```json
{
  "program_id": "44",
  "perk_participant_id": "246785"
}
```

### Admin Program Management

#### Get Program

```http
GET /api/admin/programs/{programId}
```

Fetch program details with permissions check.

#### Update Program

```http
PATCH /api/admin/programs/{programId}
```

Update program configuration.

## Route Parameters

### Path Parameters

| Parameter           | Type     | Description                   | Example               |
| ------------------- | -------- | ----------------------------- | --------------------- |
| `perkProgramId`     | `number` | Perk's program identifier     | `44`                  |
| `perkParticipantId` | `number` | Perk's participant identifier | `246785`              |
| `programId`         | `uuid`   | Internal program UUID         | `3648cab8-...`        |
| `passKind`          | `string` | Pass type                     | `loyalty`, `rewards`  |
| `resourceType`      | `string` | Resource category             | `location`, `product` |
| `resourceId`        | `string` | Resource identifier           | `store-123`           |

### Query Parameters

| Parameter    | Type     | Description                  | Example                   |
| ------------ | -------- | ---------------------------- | ------------------------- |
| `program_id` | `number` | Filter by Perk Program ID    | `?program_id=44`          |
| `email`      | `string` | Search participants by email | `?email=user@example.com` |
| `status`     | `string` | Filter by status             | `?status=active`          |

## Response Formats

### Success Response

```json
{
  "ok": true,
  "data": {
    /* response data */
  }
}
```

### Error Response

```json
{
  "ok": false,
  "error": "error_code",
  "detail": "Human readable error message"
}
```

### Common Error Codes

| Code                    | Status | Description                       |
| ----------------------- | ------ | --------------------------------- |
| `invalid_scope`         | 400    | Invalid program or participant ID |
| `participant_not_found` | 404    | Participant doesn't exist         |
| `provider_error`        | 500    | Apple/Google API error            |
| `template_not_found`    | 404    | Template not published            |
| `permission_denied`     | 403    | Insufficient permissions          |

## Rate Limiting

- **Install routes**: 10 requests/minute per IP
- **Admin routes**: 100 requests/minute per session
- **Webhook routes**: 1000 requests/minute per program
- **Apple Web Service**: Follows Apple's rate limits

## CORS Policy

- **Public routes** (`/w/*`): Allow all origins
- **Admin routes** (`/admin/*`): Same-origin only
- **API routes** (`/api/*`): Configurable per route
