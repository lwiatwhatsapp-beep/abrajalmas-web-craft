/**
 * Netlify Scheduled Function — runs every 3 days at 09:00 UTC
 * Pings the Supabase project to prevent it from pausing on inactivity.
 */

export default async () => {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn("[keep-alive] Supabase env vars not set — skipping ping.");
    return new Response("not configured", { status: 200 });
  }

  try {
    const res = await fetch(`${url}/rest/v1/services?select=id&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });
    console.log(`[keep-alive] Supabase ping: ${res.status} at ${new Date().toISOString()}`);
  } catch (err) {
    console.error("[keep-alive] Supabase ping failed:", err);
  }

  return new Response("ok", { status: 200 });
};

/** Run every 3 days at 09:00 UTC */
export const config = { schedule: "0 9 */3 * *" };
