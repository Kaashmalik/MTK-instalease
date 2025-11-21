/**
 * Sentry Server Configuration
 * 
 * Configures Sentry for server-side error tracking.
 * This file is automatically loaded by Next.js for server-side code.
 * 
 * @module sentry.server.config
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === "development",
  
  // Filter out sensitive data
  beforeSend(event, hint) {
    // Don't send events in development unless explicitly testing
    if (process.env.NODE_ENV === "development" && !process.env.SENTRY_DEBUG) {
      return null;
    }
    
    // Remove sensitive information from error messages
    if (event.request) {
      // Remove headers that might contain sensitive data
      if (event.request.headers) {
        const sensitiveHeaders = [
          "authorization",
          "cookie",
          "x-api-key",
          "x-auth-token",
        ];
        sensitiveHeaders.forEach((header) => {
          if (event.request.headers[header]) {
            event.request.headers[header] = "[Filtered]";
          }
        });
      }
      
      // Remove query parameters
      if (event.request.url) {
        try {
          const url = new URL(event.request.url);
          url.search = "";
          event.request.url = url.toString();
        } catch (e) {
          // Invalid URL, keep as is
        }
      }
    }
    
    return event;
  },
  
  // Set environment
  environment: process.env.NODE_ENV || "development",
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",
});

