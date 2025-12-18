import type { RequestHandler } from "@sveltejs/kit";
import { error, redirect } from "@sveltejs/kit";

/**
 * Validate that a URL points to an allowed external domain.
 *
 * @param target - Parsed URL to validate
 * @returns True if the URL is allowed for outbound redirection
 */
const isAllowedDomain = (target: URL): boolean => {
  const host = target.hostname.toLowerCase();
  return host === "totalwine.com" || host.endsWith(".totalwine.com");
};

/**
 * Redirect to a validated external URL.
 *
 * @param event - SvelteKit request event
 * @returns Redirect response to the external URL
 */
export const GET: RequestHandler = ({ url }) => {
  const rawTarget = url.searchParams.get("url")?.trim() || undefined;
  if (!rawTarget) {
    throw error(400, "Missing url parameter");
  }

  let target: URL;
  try {
    target = new URL(rawTarget);
  } catch {
    throw error(400, "Invalid url parameter");
  }

  if (target.protocol !== "https:") {
    throw error(400, "Only https URLs are allowed");
  }

  if (!isAllowedDomain(target)) {
    throw error(400, "URL domain is not allowed");
  }

  throw redirect(302, target.toString());
};
