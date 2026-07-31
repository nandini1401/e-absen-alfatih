import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

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

export function passwordCocok(input: string): true | string {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return "ADMIN_PASSWORD belum diatur";
  const normalizedInput = input.trim();
  const normalizedExpected = expected.trim();
  const a = createHash("sha256").update(normalizedInput, "utf8").digest();
  const b = createHash("sha256").update(normalizedExpected, "utf8").digest();
  return timingSafeEqual(a, b) ? true : "Password salah";
}
