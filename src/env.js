import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		AUTH_SECRET:
			process.env.NODE_ENV === "production"
				? z.string()
				: z.string().optional(),
		AUTH_RESEND_KEY: z.string(),
		AUTH_RESEND_FROM: z.string(),
		DATABASE_URL: z.string().url(),
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
		POSTHOG_KEY: z.string(),
		POSTHOG_HOST: z.string().url(),
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		NEXT_PUBLIC_POSTHOG_KEY: z.string(),
		NEXT_PUBLIC_POSTHOG_HOST: z.string().url(),
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
	 * middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		AUTH_SECRET: process.env.AUTH_SECRET,
		AUTH_RESEND_KEY: process.env.AUTH_RESEND_KEY,
		AUTH_RESEND_FROM: process.env.AUTH_RESEND_FROM,
		DATABASE_URL: process.env.DATABASE_URL,
		NODE_ENV: process.env.NODE_ENV,
		POSTHOG_KEY: process.env.POSTHOG_KEY,
		POSTHOG_HOST: process.env.POSTHOG_HOST,
		NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
		NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
	},
	/**
	 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
	 * useful for Docker builds.
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	/**
	 * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
	 * `SOME_VAR=''` will throw an error.
	 */
	emptyStringAsUndefined: true,
});

if (
	typeof window === "undefined" &&
	process.env.NODE_ENV !== "production" &&
	env.POSTHOG_KEY &&
	env.NEXT_PUBLIC_POSTHOG_KEY &&
	env.POSTHOG_KEY !== env.NEXT_PUBLIC_POSTHOG_KEY
) {
	// eslint-disable-next-line no-console
	console.warn(
		"[env] POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_KEY differ; ensure they point to the same project.",
	);
}
if (
	typeof window === "undefined" &&
	process.env.NODE_ENV !== "production" &&
	env.POSTHOG_HOST &&
	env.NEXT_PUBLIC_POSTHOG_HOST &&
	env.POSTHOG_HOST !== env.NEXT_PUBLIC_POSTHOG_HOST
) {
	// eslint-disable-next-line no-console
	console.warn(
		"[env] POSTHOG_HOST and NEXT_PUBLIC_POSTHOG_HOST differ; ensure they target the same ingestion host.",
	);
}
