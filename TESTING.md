# Testing Guide

This project uses Playwright for end-to-end testing with a dedicated test database.

## Quick Start

1. **Run all e2e tests:**
   ```bash
   pnpm e2e:test:with-db
   ```

2. **Run tests without database setup:**
   ```bash
   pnpm e2e:test
   ```

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm e2e:test` | Run Playwright tests (requires database to be running) |
| `pnpm e2e:test:with-db` | Run tests with automatic database setup and teardown |
| `pnpm e2e:db:setup` | Set up test database (start, reset, migrate) |
| `pnpm e2e:db:reset` | Reset test database (clear event data) |
| `pnpm test:run` | Run unit tests (Vitest) |
| `pnpm test:coverage` | Run unit tests with coverage report |

## Test Database

The test database runs in a Docker container on port 5433 to avoid conflicts with local PostgreSQL.

- **Host:** localhost:5433
- **Database:** test
- **Username:** test
- **Password:** test

### Database Management

```bash
# Start database
docker compose up -d test-db

# Stop database
docker compose stop test-db
# (optional) Remove the single service + volumes
# docker compose rm -fsv test-db

# View logs
docker compose logs test-db

# Reset database
pnpm e2e:db:reset
```

## Test Structure

```text
tests/
├── auth.setup.ts          # Authentication setup for tests
├── auth-helpers.ts        # Authentication utilities
├── db-helpers.ts          # Database utilities
├── event.spec.ts          # Event creation tests
└── homepage.spec.ts       # Homepage tests
```

## Authentication Testing

Tests use a simple authentication approach:

1. **Setup**: `auth.setup.ts` creates a test user and saves authentication state
2. **Tests**: Individual tests authenticate using `authenticatePage()` helper
3. **Verification**: Tests verify authentication by checking for "Logged in as" text

### Test User

- **Email:** test@example.com
- **Name:** Test User
- **ID:** test-user-id

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from "@playwright/test";
import { authenticatePage } from "./auth-helpers.js";

test("my test", async ({ page }) => {
  // Authenticate user
  await authenticatePage(page);
  
  // Navigate and test
  await page.goto("/");
  await expect(page.getByText("Logged in as")).toBeVisible();
});
```

### Database Helpers

```typescript
import { resetDatabaseBeforeTest } from "./db-helpers.js";

test.beforeEach(async () => {
  await resetDatabaseBeforeTest(); // Fresh DB before each test
});
```

## Environment Variables

Test environment variables are configured in `playwright.config.ts`:

```env
DATABASE_URL=postgresql://test:test@localhost:5433/test
AUTH_SECRET=test-secret-for-e2e-tests
AUTH_RESEND_KEY=test-resend-key
AUTH_RESEND_FROM=test@example.com
POSTHOG_KEY=phc_test_key
POSTHOG_HOST=https://test.posthog.com
NEXT_PUBLIC_POSTHOG_KEY=phc_test_key
NEXT_PUBLIC_POSTHOG_HOST=https://test.posthog.com
NODE_ENV=test
```

## CI/CD Integration

For CI/CD pipelines, use the `e2e:test:with-db` command which automatically manages the database lifecycle:

```bash
pnpm e2e:test:with-db
```

This ensures the database is started before tests and cleaned up afterward.

## Troubleshooting

### Database Not Ready
```bash
# Check if database is running
docker compose ps test-db

# View database logs
docker compose logs test-db

# Restart database
docker compose restart test-db
```

### Authentication Issues
```bash
# Clear stored authentication state
rm -rf playwright/.auth/

# Re-run auth setup
pnpm playwright test --project="setup auth"
```

### Port Conflicts
If port 5433 is in use, modify the port mapping in `docker-compose.yml`:

```yaml
ports:
  - "5434:5432"  # Change 5433 to 5434
```

## Best Practices

1. **Test Isolation**: Each test should be independent and clean up after itself
2. **Authentication**: Always verify authentication state in tests
3. **Database**: Use `resetDatabaseBeforeTest()` for tests that modify data
4. **Error Handling**: Provide meaningful error messages and handle failures gracefully
5. **Performance**: Use `waitForLoadState("networkidle")` for reliable page loads
