import type { Config } from "drizzle-kit";

export default {
	schema: "./src/server/db/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: "postgresql://test:test@localhost:5433/test",
	},
	tablesFilter: ["pdx-diy_*"],
} satisfies Config;
