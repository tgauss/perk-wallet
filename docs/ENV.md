# Environment Variables

Complete reference for all environment variables used in Perk Wallet.

## Public Variables (NEXT*PUBLIC*\*)

These variables are safe for client-side exposure and are included in the browser bundle.

### Application URLs

```bash
# Base application URL
NEXT_PUBLIC_APP_URL=https://pass.perk.ooo
# Used by: QR code generation, webhook URLs, install links
# Required: Yes
# Default: http://localhost:3000 (development)
```

### Supabase Public Configuration

```bash
# Supabase project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# Used by: Client-side database connections, admin interface
# Required: Yes
# Example: https://abcdefghijklmnop.supabase.co

# Supabase anonymous/public API key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Used by: Client-side API calls, Row Level Security
# Required: Yes
# Note: Safe for client exposure due to RLS policies
```

## Server-Only Variables

These variables contain sensitive data and are never sent to the client.

### Database Configuration

```bash
# Supabase service role key (admin privileges)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Used by: Server-side database operations, bypassing RLS
# Required: Yes
# Security: HIGH - Can access all data
```

### Perk API Integration

```bash
# Perk API base URL
PERK_BASE_URL=https://perk.studio
# Used by: Perk API client initialization
# Required: No
# Default: https://perk.studio

# Perk API base URL (alternative)
PERK_API_URL=https://perk.studio
# Used by: Legacy API client code
# Required: No
# Default: https://perk.studio

# Perk program API key
PERK_API_KEY=your-perk-api-key-here
# Used by: Perk API authentication, participant data fetching
# Required: Yes
# Security: HIGH - Provides access to program data

# Perk webhook signature secret
PERK_WEBHOOK_SECRET=your-webhook-secret-here
# Used by: HMAC-SHA256 webhook signature validation
# Required: Yes
# Security: HIGH - Prevents webhook spoofing
```

### Security Secrets

```bash
# QR code signing secret
QR_SIGNING_SECRET=your-random-secret-for-qr-signing
# Used by: QR code HMAC-SHA256 signing and verification
# Required: Yes
# Security: HIGH - Prevents QR code tampering
# Recommendation: Use 32+ character random string

# Admin emulator secret
APP_EMULATOR_SECRET=your-secure-admin-secret
# Used by: Admin role emulation and JWT signing
# Required: Yes (for admin access)
# Security: HIGH - Controls admin interface access
# Recommendation: Use 32+ character random string
```

### Apple Wallet Configuration

```bash
# Apple Pass Type Identifier
APPLE_PASS_TYPE_IDENTIFIER=pass.com.yourcompany.perkwallet
# Used by: Pass generation, Apple Web Service endpoints
# Required: Yes (for Apple Wallet)
# Format: pass.com.domain.app-name
# Example: pass.com.perk.rewards

# Apple Team Identifier
APPLE_TEAM_IDENTIFIER=ABCD123456
# Used by: Pass certificate validation
# Required: Yes (for Apple Wallet)
# Format: 10-character alphanumeric string
# Found in: Apple Developer Console

# Apple Web Service URL
APPLE_WEB_SERVICE_URL=https://pass.perk.ooo/api/apple
# Used by: Pass web service endpoint configuration
# Required: Yes (for Apple Wallet)
# Must match: URL configured in Apple Developer Console

# Apple authentication token secret
APPLE_AUTH_TOKEN_SECRET=your-apple-auth-secret
# Used by: Apple Web Service request authentication
# Required: Yes (for Apple Wallet)
# Security: HIGH - Validates Apple Web Service requests

# Apple Pass Certificate (P12 format, base64 encoded)
APPLE_PASS_CERT_P12_BASE64=MIIC...base64-encoded-p12-data...
# Used by: Pass signing and generation
# Required: Yes (for Apple Wallet)
# Security: CRITICAL - Private key for pass signing
# Format: Base64-encoded .p12 certificate file

# Apple Pass Certificate Password
APPLE_PASS_CERT_PASSWORD=your-certificate-password
# Used by: Decrypting P12 certificate for pass signing
# Required: Yes (for Apple Wallet)
# Security: CRITICAL - Protects certificate private key
```

### Google Wallet Configuration

```bash
# Google Wallet Issuer ID
GOOGLE_WALLET_ISSUER_ID=your-issuer-id-here
# Used by: Google Wallet pass and class creation
# Required: Yes (for Google Wallet)
# Format: Numeric string (e.g., "3388000000022137069")
# Found in: Google Pay Console

# Google Wallet Service Account Email
GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
# Used by: Google Wallet API authentication
# Required: Yes (for Google Wallet)
# Format: service-account@project-id.iam.gserviceaccount.com

# Google Wallet Service Account Key (JSON format)
GOOGLE_WALLET_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
# Used by: Google Wallet API authentication
# Required: Yes (for Google Wallet)
# Security: CRITICAL - Service account private key
# Format: Complete JSON service account key

# Alternative: Google Service Account Key (Base64 encoded)
GOOGLE_WALLET_SA_JSON_BASE64=eyJ0eXBlIjoi...
# Used by: Alternative format for service account key
# Required: Alternative to GOOGLE_WALLET_SERVICE_ACCOUNT_KEY
# Security: CRITICAL - Base64-encoded service account JSON
```

### Optional Debug Settings

```bash
# Apple Doctor debug mode
APPLE_DOCTOR_DEBUG=true
# Used by: Apple Wallet diagnostics for detailed logging
# Required: No
# Default: false
# Values: true, false

# Node.js environment
NODE_ENV=production
# Used by: Framework behavior, error handling, logging
# Required: No
# Default: development
# Values: development, production, test
```

## Environment Setup by Deployment

### Local Development (.env.local)

```bash
# Required for development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiI...
PERK_API_KEY=your-api-key
PERK_WEBHOOK_SECRET=your-webhook-secret
QR_SIGNING_SECRET=your-qr-secret
APP_EMULATOR_SECRET=dev-secret-123

# Optional for development
APPLE_PASS_TYPE_IDENTIFIER=pass.com.dev.perkwallet
APPLE_TEAM_IDENTIFIER=DEV1234567
APPLE_WEB_SERVICE_URL=http://localhost:3000/api/apple
APPLE_AUTH_TOKEN_SECRET=dev-apple-secret
APPLE_PASS_CERT_P12_BASE64=...
APPLE_PASS_CERT_PASSWORD=...
GOOGLE_WALLET_ISSUER_ID=...
GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_WALLET_SERVICE_ACCOUNT_KEY=...
```

### Vercel Production

```bash
# Set in Vercel Dashboard → Project → Settings → Environment Variables

# Required
NEXT_PUBLIC_APP_URL=https://pass.perk.ooo
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key...
SUPABASE_SERVICE_ROLE_KEY=prod-service-key...
PERK_API_KEY=prod-api-key...
PERK_WEBHOOK_SECRET=prod-webhook-secret...
QR_SIGNING_SECRET=prod-qr-secret...
APP_EMULATOR_SECRET=prod-admin-secret...

# Apple Wallet (production certificates)
APPLE_PASS_TYPE_IDENTIFIER=pass.com.perk.rewards
APPLE_TEAM_IDENTIFIER=PROD123456
APPLE_WEB_SERVICE_URL=https://pass.perk.ooo/api/apple
APPLE_AUTH_TOKEN_SECRET=prod-apple-secret...
APPLE_PASS_CERT_P12_BASE64=prod-cert-data...
APPLE_PASS_CERT_PASSWORD=prod-cert-password...

# Google Wallet (production service account)
GOOGLE_WALLET_ISSUER_ID=prod-issuer-id...
GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL=prod-service@project.iam.gserviceaccount.com
GOOGLE_WALLET_SERVICE_ACCOUNT_KEY={"type":"service_account"...}
```

## Security Best Practices

### Secret Management

```bash
# ✅ Good practices:
# - Use different secrets for each environment
# - Rotate secrets regularly (quarterly)
# - Use 32+ character random strings for custom secrets
# - Store in environment-specific variable groups
# - Never commit secrets to git

# ❌ Avoid:
# - Reusing secrets across environments
# - Predictable or weak secrets
# - Storing secrets in code files
# - Sharing secrets via insecure channels
```

### Access Control

```bash
# Limit environment variable access:
# - Production: Only essential team members
# - Staging: Development team + QA
# - Development: All developers

# Use role-based access in:
# - Vercel team permissions
# - Supabase project access
# - Apple Developer Console
# - Google Cloud Console
```

### Secret Rotation

```bash
# Rotation schedule:
# - API keys: Quarterly
# - Webhook secrets: Quarterly
# - QR signing secrets: Annually
# - Admin emulator secrets: Monthly
# - Certificates: Before expiration

# Rotation process:
# 1. Generate new secret
# 2. Update in environment
# 3. Deploy application
# 4. Update external services (Perk platform)
# 5. Verify functionality
# 6. Revoke old secret
```

## Validation and Diagnostics

### Required Variables Check

```bash
# Use the admin doctor endpoint to validate all variables:
curl http://localhost:3000/api/admin/doctor

# Checks:
# - All required variables present
# - Supabase connectivity
# - Apple certificate validity
# - Google service account authentication
```

### Common Configuration Issues

#### Supabase Connection Failures

```bash
# Symptoms: Database connection errors, auth failures
# Check: NEXT_PUBLIC_SUPABASE_URL format
# Check: SUPABASE_SERVICE_ROLE_KEY validity
# Verify: Project not paused in Supabase console
```

#### Apple Wallet Issues

```bash
# Symptoms: Pass generation failures, certificate errors
# Check: APPLE_PASS_CERT_P12_BASE64 is valid base64
# Check: APPLE_PASS_CERT_PASSWORD matches certificate
# Verify: Certificate not expired
# Verify: APPLE_PASS_TYPE_IDENTIFIER matches developer console
```

#### Google Wallet Issues

```bash
# Symptoms: Pass creation failures, authentication errors
# Check: GOOGLE_WALLET_SERVICE_ACCOUNT_KEY is valid JSON
# Check: Service account has Wallet Objects Admin role
# Verify: GOOGLE_WALLET_ISSUER_ID matches Google Pay Console
```

#### Webhook Issues

```bash
# Symptoms: Webhook signature validation failures
# Check: PERK_WEBHOOK_SECRET matches Perk platform configuration
# Verify: Secret encoding (no extra whitespace/newlines)
```

## Port Configuration

### Development Ports

```bash
# Next.js development server
PORT=3000  # Default, auto-increments if occupied
# Alternatives: 3001, 3002, etc.

# Common port conflicts:
# - 3000: React development servers
# - 3001: Other Next.js projects
# - 8000: Python development servers

# Update URLs if using non-default port:
NEXT_PUBLIC_APP_URL=http://localhost:3001
APPLE_WEB_SERVICE_URL=http://localhost:3001/api/apple
```

### Production Configuration

```bash
# Vercel automatically handles port assignment
# No port configuration needed

# Custom domains:
NEXT_PUBLIC_APP_URL=https://your-custom-domain.com
APPLE_WEB_SERVICE_URL=https://your-custom-domain.com/api/apple
```
