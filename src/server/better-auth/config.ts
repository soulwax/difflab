import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { env } from "~/env";
import { db } from "~/server/db";
import * as schema from "~/server/db/schema";

const authBaseUrl = (env.BETTER_AUTH_URL ?? env.NEXT_PUBLIC_APP_URL).replace(
	/\/$/,
	"",
);
const appBaseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
const authHost = new URL(authBaseUrl).host;
const appHost = new URL(appBaseUrl).host;
const localAuthOrigins = [
	"http://localhost:3000",
	"http://127.0.0.1:3000",
	"http://localhost:3001",
	"http://127.0.0.1:3001",
];

export const auth = betterAuth({
	baseURL: {
		allowedHosts: [
			authHost,
			appHost,
			"localhost:3000",
			"127.0.0.1:3000",
			"localhost:3001",
			"127.0.0.1:3001",
		],
		fallback: authBaseUrl,
		protocol: env.NODE_ENV === "production" ? "https" : "auto",
	},
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),
	emailAndPassword: {
		enabled: false,
	},
	secret: env.BETTER_AUTH_SECRET,
	trustedOrigins: [authBaseUrl, appBaseUrl, ...localAuthOrigins],
	socialProviders: {
		github: {
			clientId: env.BETTER_AUTH_GITHUB_CLIENT_ID,
			clientSecret: env.BETTER_AUTH_GITHUB_CLIENT_SECRET,
		},
	},
});

export type Session = typeof auth.$Infer.Session;
