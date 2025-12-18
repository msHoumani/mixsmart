import { createAuthClient } from "better-auth/svelte";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { twoFactorClient } from "better-auth/client/plugins";

/**
 * BetterAuth client instance for client-side auth operations.
 * Includes Convex integration and 2FA client plugins.
 */
export const authClient = createAuthClient({
  plugins: [convexClient(), twoFactorClient()]
});

/**
 * Commonly used auth methods for components.
 */
export const { signIn, signUp, signOut, useSession } = authClient;
