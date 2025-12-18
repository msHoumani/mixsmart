import { defineApp } from "convex/server";
import betterAuth from "@convex-dev/better-auth/convex.config";

/**
 * Convex application configuration.
 * Registers the BetterAuth component for authentication management.
 */
const app = defineApp();

app.use(betterAuth);

export default app;
