import type { Handle } from "@sveltejs/kit";
import { createAuth } from "$convex/auth.js";
import { getToken } from "@mmailaender/convex-better-auth-svelte/sveltekit";

/**
 * SvelteKit server hook for auth token extraction.
 * Makes auth token available in event.locals for server-side operations.
 */
export const handle: Handle = async ({ event, resolve }) => {
  event.locals.token = await getToken(createAuth, event.cookies);
  return resolve(event);
};
