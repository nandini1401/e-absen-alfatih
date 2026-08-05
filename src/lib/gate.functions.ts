import { createServerFn } from "@tanstack/react-start";

export const statusAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { sesiAdmin, hasAdminAccount } = await import("./gate.server");
  const session = await sesiAdmin();
  const hasAdmin = await hasAdminAccount();
  return { admin: session.data.admin === true, hasAdmin };
});

export const loginAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    const {
      sesiAdmin,
      hasAdminAccount,
      createAdminAccount,
      verifyAdminCredentials,
    } = await import("./gate.server");

    const hasAdmin = await hasAdminAccount();
    if (!hasAdmin) {
      const createResult = await createAdminAccount(data.email, data.password);
      if (createResult !== true) {
        return { ok: false as const, reason: createResult };
      }
    } else {
      const passwordCheck = await verifyAdminCredentials(data.email, data.password);
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
