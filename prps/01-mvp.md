# Perk Wallet MVP PRP

Goal
- Issue two grouped passes per participant: Loyalty and My Rewards.
- Canonical ID and QR payload: PERK UUID, signed.
- Sync points, tier, status from Perk in ≤ 60s p95.
- Universal magic link: https://wallet.perk.ooo/{programId}/{perkUuid}.
- Write safe wallet identifiers + install_url back to Perk profile_attributes.

Tech
- Next.js 14 App Router, TypeScript
- Supabase Postgres
- Vercel deploy
- Node 20
- Apple passkit-generator, Google Wallet REST, zod, jose

APIs
- Perk base https://perk.studio, Bearer program API key
- Use: POST /api/v2/participants, GET /api/v2/participants/email/{email}, PUT /api/v2/participants/points, PUT /api/v2/participants/{id}

Security
- Webhooks header: X-Perk-Secret
- Signed QR: HMAC-SHA256(uuid|ts|nonce), TTL 180s
- Keep secrets out of Perk

Data
- Supabase tables: programs, templates, participants, passes, jobs

Build
- Routes:
  - POST /api/webhooks/perk
  - POST /api/passes/issue
  - PATCH /api/passes/[perk_uuid]
  - POST /api/passes/[perk_uuid]/notify
  - GET /w/{programId}/{perkUuid}
  - POST /api/install-token
  - Apple Wallet web service endpoints
- Libs:
  - perk client with retry + 429 backoff
  - qr sign/verify
  - applePass builder with webServiceURL, authenticationToken, groupingIdentifier = String(programId)
  - googleWallet builder with class/object and multi-object JWT
  - jobs queue helpers

Rules
- Always issue Loyalty + My Rewards together
- Group on iOS by groupingIdentifier = String(programId)
- QR verifier returns PERK UUID
- Write back to Perk profile_attributes:
  - wallet.install_url = https://wallet.perk.ooo/{programId}/{perkUuid}
  - wallet.apple.serial, wallet.google.object_id, wallet.version, timestamps
- Skip updates when hash unchanged
- Idempotency = event.id or sha256(body)

Webhooks
- new_participant → ensure cache, issue passes, write back install_url and IDs
- points_earned | challenge_completed → refresh from Perk, update passes
- reward_earned → update My Rewards, notify

Tests
- QR sign/verify
- 429 backoff
- webhook idempotency
- pass build smoke test

Output
- Working routes and libs
- Minimal admin pages for Programs, Templates, Participants
- README with setup
