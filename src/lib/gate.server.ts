import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type GateSession = { admin?: boolean };

function sessionConfig() {
  const password = process.env.SESSION_SECRET;
  if (!password) throw new Error("SESSION_SECRET belum diatur");
  const isProduction = process.env.NODE_ENV === "production";
  return {
    password,
    name: "admin-gate",
    maxAge: 60 * 60 * 8,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ("none" as const) : ("lax" as const),
      path: "/",
    },
  };
}

export async function sesiAdmin() {
  return useSession<GateSession>(sessionConfig());
}

function normalizePassword(input: string) {
  return input.trim();
}

function hashPassword(password: string) {
  return createHash("sha256").update(normalizePassword(password), "utf8").digest("hex");
}

async function getStoredAdminPasswordHash() {
  const { data, error } = await supabaseAdmin
    .from("admin_credentials")
    .select("password_hash")
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.password_hash ?? null;
}

export async function hasAdminPassword(): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("admin_credentials")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function verifyAdminPassword(input: string): Promise<true | string> {
  const expectedHash = await getStoredAdminPasswordHash();
  if (!expectedHash) return "Belum ada password admin. Silakan daftarkan password baru.";

  const inputHash = hashPassword(input);
  const a = Buffer.from(inputHash, "hex");
  const b = Buffer.from(expectedHash, "hex");

  if (a.length !== b.length) return "Password salah";
  return timingSafeEqual(a, b) ? true : "Password salah";
}

export async function createAdminPassword(input: string): Promise<true | string> {
  const existing = await hasAdminPassword();
  if (existing) return "Admin sudah terdaftar";

  const passwordHash = hashPassword(input);
  const { error } = await supabaseAdmin
    .from("admin_credentials")
    .insert({ password_hash: passwordHash });

  if (error) return error.message;
  return true;
}
