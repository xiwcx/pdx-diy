import "~/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { PostHogPageview } from "./_components/posthog-pageview";
import { Providers } from "./providers";

/**
 * Application metadata for SEO and browser display.
 *
 * Defines the page title, description, and favicon that appear
 * in browser tabs, search results, and social media previews.
 */
export const metadata: Metadata = {
	title: "PDX DIY",
	description: "Events for the DIY community in Portland, Oregon",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

/**
 * Geist font configuration for the application.
 *
 * Uses Google Fonts with Latin character subset for optimal
 * loading performance and broad language support.
 */
const geist = Geist({
	subsets: ["latin"],
});

/**
 * Root layout component that wraps all pages in the application.
 *
 * Sets up the HTML structure, fonts, and global providers including
 * PostHog analytics, tRPC, and authentication. This layout applies
 * to all routes in the application.
 *
 * @param children - Page content to be rendered within the layout
 * @returns The complete HTML document structure
 *
 * @example
 * ```tsx
 * // Automatically wraps all pages
 * <RootLayout>
 *   <HomePage />
 * </RootLayout>
 * ```
 */
export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en">
			<body className={geist.className}>
				<Providers>
					<TRPCReactProvider>
						<PostHogPageview />
						{children}
					</TRPCReactProvider>
				</Providers>
			</body>
		</html>
	);
}
