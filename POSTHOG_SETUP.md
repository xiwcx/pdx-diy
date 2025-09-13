# PostHog Setup for PDX DIY

This document explains how PostHog analytics is set up in this Next.js application.

## Overview

PostHog is configured for both client-side and server-side tracking:

- **Client-side**: Automatic pageview tracking, user interactions, and feature flags
- **Server-side**: Custom event tracking in API routes and server components

## Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# PostHog Configuration
POSTHOG_KEY="phc_your_project_key_here"
POSTHOG_HOST="https://us.i.posthog.com"
NEXT_PUBLIC_POSTHOG_KEY="phc_your_project_key_here"
NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"
```

You can find your project API key in your PostHog project settings.

## Files Added/Modified

### Server-side PostHog (`src/server/posthog.ts`)

- Singleton PostHog client for server-side use
- Helper functions for capturing events, identifying users, and checking feature flags
- Error handling to prevent PostHog failures from breaking your app

### Client-side Components

- `src/app/providers.tsx`: Main providers file for client-side providers (PostHog, etc.)
- `src/app/_components/posthog-pageview.tsx`: Automatic pageview tracking component

### Layout Integration (`src/app/layout.tsx`)

- Wraps the app with the main Providers component
- Includes pageview tracking component

### Environment Configuration (`src/env.js`)

- Added PostHog environment variables to the validation schema
- Ensures proper type checking for PostHog configuration

## Usage Examples

### Server-side Event Tracking

```typescript
import { captureEvent, identifyUser, getFeatureFlags } from "~/server/posthog";

// Capture a custom event
await captureEvent('user123', 'button_clicked', {
  button_name: 'signup',
  page: 'home'
});

// Identify a user
await identifyUser('user123', {
  email: 'user@example.com',
  name: 'John Doe'
});

// Get feature flags
const flags = await getFeatureFlags('user123');
const isFeatureEnabled = flags['new-feature'] === true;
```

### Client-side Usage

```typescript
import { usePostHog } from 'posthog-js/react';

function MyComponent() {
  const posthog = usePostHog();

  const handleClick = () => {
    posthog.capture('button_clicked', {
      button_name: 'cta',
      page: 'pricing'
    });
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

## Features Enabled

- ✅ Event capture (client & server)
- ✅ User identification
- ✅ Automatic pageview tracking
- ✅ Feature flags
- ✅ Session replay (optional; enable via posthog-js with session recording APIs)
- ✅ Error tracking (optional; integrate with your error boundary or PostHog capture)

## API Routes with Tracking

The following API routes include PostHog tracking:

- **Event Creation** (`/api/trpc/event.create`): Tracks when users create events
- **Event Listing** (`/api/trpc/event.getMany`): Tracks when events are listed

## Server Components with Tracking

- **Home Page** (`/`): Tracks page visits with authentication status

## Next Steps

1. Set up your PostHog project and get your API key
2. Add the environment variables to your `.env.local` file
3. Deploy and verify events are being captured in your PostHog dashboard
4. Set up feature flags and experiments as needed
5. Configure session replay and other advanced features

## Troubleshooting

- Check that all environment variables are properly set
- Verify PostHog API key is correct
- Check browser console for any PostHog-related errors
- Ensure PostHog host URL is accessible from your deployment environment
