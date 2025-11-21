/**
 * Next.js Instrumentation Hook
 * 
 * This file is used to initialize Sentry and other monitoring tools
 * when the Next.js server starts.
 * 
 * @module instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Initialize server-side monitoring
    await import("./sentry.server.config");
  }
  
  if (process.env.NEXT_RUNTIME === "edge") {
    // Initialize edge runtime monitoring
    await import("./sentry.edge.config");
  }
}

