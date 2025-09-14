# AGENTS.md

## Project Overview

PDX-DIY is an open-source Next.js 15 application using TypeScript, tRPC, Drizzle ORM, NextAuth.js, and PostHog analytics. This is a community-driven project prioritizing security, code quality, and simplicity.

## Setup Commands

- Install dependencies: `pnpm install`
- Start dev server: `pnpm dev --turbo`
- Run database migrations: `pnpm db:push`
- Type checking: `pnpm typecheck`
- Linting and formatting: `pnpm check`
- Auto-fix formatting: `pnpm check:write`

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **API**: tRPC with React Query
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: NextAuth.js with Resend email provider
- **Analytics**: PostHog
- **Linting**: Biome

## Code Style

- TypeScript strict mode (no `any` types)
- Use Biome for formatting and linting
- Prefer functional patterns and composition
- Early returns to reduce nesting
- camelCase for variables, PascalCase for components
- Descriptive names with boolean prefixes (`is`, `has`, `can`)

## File Organization

- Server code: `~/server/`
- Client code: `~/app/`
- Components: `~/app/_components/`
- Use barrel exports for clean imports
- Follow T3 App directory structure

## Priority Order

1. **Security** - Highest priority
2. **Code Quality & Simplicity** - High priority
3. **Performance** - Medium priority
4. **Feature completeness** - Lower priority

## Security Guidelines

### Environment Variables

- Always use `env.js` schema validation for sensitive data
- Never hardcode API keys, secrets, or database URLs
- Use `NEXT_PUBLIC_` prefix only for truly public data
- Server secrets must never be exposed to client-side code

### Authentication

- Use `protectedProcedure` for authenticated tRPC endpoints
- Validate user ownership before data access/modification
- Never trust client-side user IDs or session data
- Always use NextAuth.js session validation

### Database Security

- Use Drizzle ORM query builder, never raw SQL
- Validate all inputs with Zod schemas
- Use proper foreign key relationships and constraints
- Never concatenate user input into queries

 ### PostHog Analytics

 - Only send non-sensitive user data to PostHog
 - Use server-side PostHog for sensitive operations
 - Never send PII, auth tokens, or internal IDs to analytics
 - PostHog project API key (starts with `phc_`) is public by design; do not treat it as a secret. Ensure client and server keys/hosts target the same project/host across environments.

## Testing Instructions

- Run `pnpm check` before committing (Biome linting)
- Run `pnpm typecheck` to verify TypeScript compliance
- Run `pnpm db:push` to apply database changes
- Run `pnpm test:run` for agentic workflows (use `pnpm test` for development with watch mode)
- All code must pass strict TypeScript checks (no `any` types)
- Test authentication flows thoroughly

## Architecture Patterns

### tRPC Procedures

- Use `publicProcedure` for unauthenticated endpoints
- Use `protectedProcedure` for authenticated endpoints
- All procedures must have Zod input validation
- Use appropriate HTTP methods (query/mutation)

### Database Patterns

- Follow Drizzle schema with proper relations
- Add appropriate indexes for query performance
- Use database constraints for data integrity
- Follow table naming: `pdx-diy_${tableName}`

### Component Patterns

- Use React Server Components by default
- Add `"use client"` only when necessary
- Prefer server-side data fetching with tRPC
- Keep functions small and focused (< 20 lines)

### Error Handling

- Use tRPC error codes for consistent API responses
- Provide meaningful error messages for users
- Log errors server-side for debugging
- Never expose internal error details to clients

## Automatic Checks

Before any code submission:

- [ ] No hardcoded secrets or API keys
- [ ] Environment variables validated through `env.js`
- [ ] Authentication implemented for protected routes
- [ ] All inputs validated with Zod schemas
- [ ] TypeScript strict mode compliance (no `any` types)
- [ ] Biome checks pass (`pnpm check`)
- [ ] Server/client code properly separated
- [ ] tRPC procedures use correct authentication level

## Rejection Criteria

Code will be automatically rejected if it:

- Hardcodes secrets, API keys, or sensitive data
- Bypasses authentication/authorization checks
- Uses raw SQL instead of Drizzle ORM
- Exposes server environment variables to client
- Uses `any` type in TypeScript
- Fails Biome linting checks
- Doesn't validate user inputs with Zod
- Mixes server and client code inappropriately

## When to Ask for Help

Request human review for:

- New authentication flows
- Database schema changes
- Third-party service integrations
- Security-sensitive changes
- Performance optimization decisions

---

*Security requirements are non-negotiable. This project prioritizes security and code quality for open-source collaboration.*
