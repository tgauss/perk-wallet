# Changelog

All notable changes to the Perk Wallet project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-08-12

### Added
- **Complete Admin Interface** with role-based access control (RBAC)
  - Dashboard with system-wide and program-scoped KPIs
  - Programs management with CRUD operations
  - Templates editor with JSON validation
  - Participants search and management
  - Passes monitoring and control
  - Jobs queue monitoring with retry capability
  - Webhooks event tracking and replay
  
- **Role Emulator System** for development/testing
  - 5 roles: super_admin, program_admin, program_editor, program_viewer, support
  - JWT-based authentication emulation
  - Signed cookies with 24-hour TTL
  - Program-scoped permissions

- **Program Management Features**
  - Create new programs with API validation
  - Program status system (draft/active/inactive)
  - Status transitions with effects preview
  - Comprehensive branding configuration
  - Per-program webhook endpoints
  - Multi-tenant data isolation

- **Version Indicator Component**
  - Shows deployment version/git commit
  - Fixed position bottom-right
  - Tooltip with build information
  - Helps verify latest deployment

- **Real Supabase Integration**
  - Replaced all mock data with database queries
  - Program-scoped data filtering
  - Server-side data fetching
  - Optimistic UI updates

### Changed
- Migrated from Tailwind CSS v4 to v3 for shadcn/ui compatibility
- Updated admin routes to use App Router patterns
- Moved utility functions out of server actions files
- Enhanced error handling in API routes

### Fixed
- Build error with server actions requiring async functions
- Cookie handling in API routes for impersonation
- Tailwind CSS compatibility issues
- Failed fetch errors in role emulator

### Security
- Server-side permission checks on all admin actions
- API keys never sent to client-side code
- Cryptographically signed identity tokens
- Secret-based emulator protection

## [0.1.0] - 2025-08-10

### Added
- Initial release with core functionality
- Apple Wallet and Google Wallet pass generation
- Webhook processing for Perk events
- QR code generation with HMAC signing
- Magic link installation flow
- Multi-program support architecture
- Supabase database integration
- Rate limiting and retry logic
- Event tracking and logging

### Technical Stack
- Next.js 14 App Router
- TypeScript
- Supabase
- Vercel deployment
- passkit-generator for Apple Wallet
- Google Wallet REST API

## Development Notes

### Environment Setup
Required environment variables added:
- `APP_EMULATOR_SECRET` - For admin role emulation
- All existing Perk and Supabase configurations

### Database Migrations
- No new migrations required
- Program status stored in JSONB settings column
- Webhook secrets removed from storage

### Known Issues
- All critical issues resolved as of v0.2.0
- Admin interface requires emulator secret in production

### Next Release Planning
- Real authentication system to replace emulator
- Audit logging for admin actions
- Enhanced error tracking with Sentry
- E2E testing suite for admin workflows
- API documentation generation

---

For detailed implementation notes, see [CLAUDE.md](./CLAUDE.md)
For general documentation, see [README.md](./README.md)