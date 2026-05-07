import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		BETTER_AUTH_SECRET:
			process.env.NODE_ENV === "production"
				? z.string()
				: z.string().optional(),
		BETTER_AUTH_GITHUB_CLIENT_ID: z.string(),
		BETTER_AUTH_GITHUB_CLIENT_SECRET: z.string(),
		DATABASE_URL: z.string().url(),
		INLINE_CONTENT_MAX_BYTES: z.coerce.number().int().positive().default(65536),
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
		R2_ACCESS_KEY_ID:
			process.env.NODE_ENV === "production"
				? z.string()
				: z.string().optional(),
		R2_BUCKET_NAME:
			process.env.NODE_ENV === "production"
				? z.string()
				: z.string().optional(),
		R2_ENDPOINT:
			process.env.NODE_ENV === "production"
				? z.string().url()
				: z.string().optional(),
		R2_SECRET_ACCESS_KEY:
			process.env.NODE_ENV === "production"
				? z.string()
				: z.string().optional(),
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
	 * middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
		BETTER_AUTH_GITHUB_CLIENT_ID: process.env.BETTER_AUTH_GITHUB_CLIENT_ID,
		BETTER_AUTH_GITHUB_CLIENT_SECRET:
			process.env.BETTER_AUTH_GITHUB_CLIENT_SECRET,
		DATABASE_URL: process.env.DATABASE_URL,
		INLINE_CONTENT_MAX_BYTES: process.env.INLINE_CONTENT_MAX_BYTES,
		NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
		NODE_ENV: process.env.NODE_ENV,
		R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
		R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
		R2_ENDPOINT: process.env.R2_ENDPOINT,
		R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
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
