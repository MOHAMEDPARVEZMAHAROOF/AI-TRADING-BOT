/**
 * Public configuration with sensible defaults so the app works even if the
 * deployment environment variables are not set. The Supabase URL and anon key
 * are publishable (safe to expose to the browser); the Activepieces webhook is a
 * public ingestion endpoint. Override any of these via environment variables.
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nkirwduzticflevtwtve.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5raXJ3ZHV6dGljZmxldnR3dHZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNjI2MzMsImV4cCI6MjA5NTYzODYzM30.tuqFerTKcoSuQPWdC4kxcgrGOTf1--zzfyaQIobFcAY";

export const ACTIVEPIECES_WEBHOOK_URL =
  process.env.ACTIVEPIECES_WEBHOOK_URL ||
  "https://cloud.activepieces.com/api/v1/webhooks/0d3tjIwFhnc6mVdRN8PB0";
