import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

export type GateSession = { admin?: boolean };

function sessionConfig() {
  const password = process.env.SESSION_SECRET;
  if (!password) throw new Error("SESSION_SECRET belum diatur");
  return {
    password,
    name: "admin-gate",
    maxAge: 60 * 60 * 8,
    // Preview berjalan di dalam iframe (konteks third-party), jadi cookie
    // harus SameSite=None + Secure agar ikut terkirim setelah login.
    cookie: { httpOnly: true, secure: true, sameSite: "none" as const, path: "/" },
  };
}

export async function sesiAdmin() {
  return useSession<GateSession>(sessionConfig());
}

export function passwordCocok(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD belum diatur");
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}
