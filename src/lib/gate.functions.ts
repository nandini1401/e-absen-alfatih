import { createServerFn } from "@tanstack/react-start";

export const statusAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { sesiAdmin, hasAdminPassword } = await import("./gate.server");
  const session = await sesiAdmin();
  const hasAdmin = await hasAdminPassword();
  return { admin: session.data.admin === true, hasAdmin };
});

export const loginAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    const {
      sesiAdmin,
      hasAdminPassword,
      createAdminPassword,
      verifyAdminPassword,
    } = await import("./gate.server");

    const hasAdmin = await hasAdminPassword();
    if (!hasAdmin) {
      const createResult = await createAdminPassword(data.password);
      if (createResult !== true) {
        return { ok: false as const, reason: createResult };
      }
    } else {
      const passwordCheck = await verifyAdminPassword(data.password);
      if (passwordCheck !== true) {
        return { ok: false as const, reason: passwordCheck };
      }
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
