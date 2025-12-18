import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";

/**
 * HTTP router for Convex deployment.
 * Registers BetterAuth route handlers for authentication endpoints.
 */
const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

export default http;
