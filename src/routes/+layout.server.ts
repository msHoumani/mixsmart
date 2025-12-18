import type { LayoutServerLoad } from "./$types";
import { createAuth } from "$convex/auth.js";
import { getAuthState } from "@mmailaender/convex-better-auth-svelte/sveltekit";

/**
 * Load initial auth state for SSR to avoid loading flash.
 */
export const load: LayoutServerLoad = async ({ cookies }) => {
  return {
    authState: await getAuthState(createAuth, cookies)
  };
};
