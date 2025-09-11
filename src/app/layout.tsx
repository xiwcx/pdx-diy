import "~/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { PostHogPageview } from "./_components/posthog-pageview";
import { Providers } from "./providers";

export const metadata: Metadata = {
	title: "PDX DIY",
	description: "Events for the DIY community in Portland, Oregon",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
	subsets: ["latin"],
});

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
