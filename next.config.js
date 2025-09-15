/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
	// Enable build optimizations
	swcMinify: true,

	// Configure build caching
	experimental: {
		// Enable Turbopack for development (already used in dev script with --turbo)
		turbo: {
			// Configure Turbopack rules if needed
		},

		// Enable build caching optimizations
		webpackBuildWorker: true,

		// Enable parallel builds
		parallelServerCompiles: true,
		parallelServerBuildTraces: true,
	},

	// Configure webpack for better caching
	webpack: (config, { dev, isServer }) => {
		// Enable webpack persistent caching for production builds
		if (!dev) {
			config.cache = {
				type: "filesystem",
				cacheDirectory: ".next/cache/webpack",
				buildDependencies: {
					config: [__filename],
				},
			};
		}

		return config;
	},

	// Enable static optimization
	trailingSlash: false,
	poweredByHeader: false,

	// Configure output for better caching
	output: "standalone",

	// Enable compression
	compress: true,
};
