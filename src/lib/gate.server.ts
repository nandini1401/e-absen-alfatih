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

async function getStoredAdminAccount() {
  const { data, error } = await supabaseAdmin
    .from("admin_credentials")
    .select("id, email, password_hash")
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function hasAdminAccount(): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("admin_credentials")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function verifyAdminCredentials(email: string, password: string): Promise<true | string> {
  const account = await getStoredAdminAccount();
  if (!account) return "Belum ada akun admin. Silakan daftarkan akun baru.";
  if (account.email.trim().toLowerCase() !== normalizePassword(email).toLowerCase()) {
    return "Email atau password salah";
  }

  const inputHash = hashPassword(password);
  const expectedHash = account.password_hash;
  const a = Buffer.from(inputHash, "hex");
  const b = Buffer.from(expectedHash, "hex");

  if (a.length !== b.length) return "Email atau password salah";
  return timingSafeEqual(a, b) ? true : "Email atau password salah";
}

export async function createAdminAccount(email: string, password: string): Promise<true | string> {
  const existing = await hasAdminAccount();
  if (existing) return "Admin sudah terdaftar";

  const passwordHash = hashPassword(password);
  const { error } = await supabaseAdmin
    .from("admin_credentials")
    .insert({ email: normalizePassword(email).toLowerCase(), password_hash: passwordHash });

  if (error) return error.message;
  return true;
}
