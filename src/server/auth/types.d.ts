/**
 * JWT module augmentation for NextAuth.js
 *
 * Extends the JWT interface to include the `id` property that is used
 * in the auth configuration callbacks.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth/jwt" {
	interface JWT {
		id?: string;
	}
}
