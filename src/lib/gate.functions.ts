import { createServerFn } from "@tanstack/react-start";

export const statusAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { sesiAdmin } = await import("./gate.server");
  const session = await sesiAdmin();
  return { admin: session.data.admin === true };
});

export const loginAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    const { sesiAdmin, passwordCocok } = await import("./gate.server");
    const passwordCheck = passwordCocok(data.password);
    if (passwordCheck !== true) {
      return { ok: false as const, reason: passwordCheck };
    }

    try {
      const session = await sesiAdmin();
      await session.update({ admin: true });
      return { ok: true as const };
    } catch (error) {
      if (error instanceof Error) {
        return { ok: false as const, reason: error.message };
      }
      return { ok: false as const, reason: "Gagal membuat sesi admin" };
    }
  });

export const logoutAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { sesiAdmin } = await import("./gate.server");
  const session = await sesiAdmin();
  await session.clear();
  return { ok: true as const };
});
