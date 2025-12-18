import { getAuthConfigProvider } from "@convex-dev/better-auth/auth-config";
import type { AuthConfig } from "convex/server";

/**
 * Authentication configuration for Convex.
 * Integrates BetterAuth as the authentication provider.
 */
const authConfig = {
  providers: [getAuthConfigProvider()]
} satisfies AuthConfig;

export default authConfig;
