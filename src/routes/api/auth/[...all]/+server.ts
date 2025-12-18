import { createSvelteKitHandler } from "@mmailaender/convex-better-auth-svelte/sveltekit";

/**
 * SvelteKit route handler that proxies auth requests to Convex.
 * Handles all /api/auth/* routes (login, register, session, etc.).
 */
export const { GET, POST } = createSvelteKitHandler();
