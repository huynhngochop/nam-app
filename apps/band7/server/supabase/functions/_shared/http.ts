import { createClient, type SupabaseClient, type User } from "jsr:@supabase/supabase-js@2";

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

/** Client quyền server (bỏ qua RLS) — chỉ dùng trong Edge Function */
export const admin: SupabaseClient = createClient(
  Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

/** Xác thực người gọi bằng JWT của Supabase Auth */
export async function requireUser(req: Request): Promise<User | Response> {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthorized" }, 401);
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return json({ error: "unauthorized" }, 401);
  return data.user;
}

export const FREE_DAILY_TURNS = Number(Deno.env.get("FREE_DAILY_TURNS") ?? 30);
export const PRO_DAILY_TURNS = Number(Deno.env.get("PRO_DAILY_TURNS") ?? 400); // chặn lạm dụng
export const MAX_AUDIO_BYTES = 2_000_000; // ~60 giây m4a mono 16kHz
