# PDX DIY

[![CI](https://github.com/YOUR_USERNAME/pdx-diy/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/pdx-diy/actions/workflows/ci.yml)

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## Development

### Prerequisites
- Node.js (see `.nvmrc` for exact version)
- pnpm 10.15.1+
- PostgreSQL

### Setup
```bash
# Use the correct Node.js version (if using nvm)
nvm use

# Install dependencies
pnpm install

# Start development server
pnpm dev --turbo

# Run database migrations
pnpm db:push
```

### Testing & Quality Assurance
```bash
# Run linting and formatting
pnpm check

# Fix linting and formatting issues
pnpm check:write

# Run type checking
pnpm typecheck

# Run tests
pnpm test:run

# Run tests with coverage
pnpm test:coverage

# Build application
pnpm build
```

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!
