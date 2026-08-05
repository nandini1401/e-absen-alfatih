import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Lock, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAdmin, logoutAdmin, statusAdmin } from "@/lib/gate.functions";

export function useAdminSession() {
  return useQuery({
    queryKey: ["admin-session"],
    queryFn: () => statusAdmin(),
    staleTime: 30_000,
  });
}

export function TombolLogoutAdmin() {
  const qc = useQueryClient();
  const keluar = useServerFn(logoutAdmin);
  return (
    <Button
      size="default"
      variant="secondary"
      className="press-3d border border-primary-foreground/20 bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg"
      onClick={async () => {
        await keluar({});
        qc.invalidateQueries({ queryKey: ["admin-session"] });
        toast.success("Berhasil keluar dari Panel Admin");
      }}
    >
      <LogOut className="mr-2 size-4" /> <span className="font-semibold">Keluar Admin</span>
    </Button>
  );
}

export function AdminGate({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const sesi = useAdminSession();
  const masuk = useServerFn(loginAdmin);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = useMutation({
    mutationFn: async () => masuk({ data: { email: email.trim(), password: password.trim() } }),
    onSuccess: (res) => {
      if (res.ok) {
        setEmail("");
        setPassword("");
        qc.invalidateQueries({ queryKey: ["admin-session"] });
        toast.success("Login berhasil");
      } else {
        toast.error(res.reason ?? "Email atau password salah");
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Gagal login, coba lagi";
      toast.error(message);
    },
  });

  const isFirstSetup = sesi.data?.hasAdmin === false;
  const title = isFirstSetup ? "Daftar Akun Admin Pertama" : "Area Khusus Admin";
  const description = isFirstSetup
    ? "Daftar email dan password admin pertama. Setelah selesai, hanya login dengan akun yang terdaftar."
    : "Masukkan email dan password admin untuk mengakses halaman ini.";
  const buttonLabel = login.isPending ? "Memproses…" : isFirstSetup ? "Daftar" : "Masuk";

  if (sesi.isLoading) {
    return (
      <div className="surface-3d rounded-2xl p-10 text-center text-sm text-muted-foreground">
        Memeriksa sesi login…
      </div>
    );
  }

  if (!sesi.data?.admin) {
    return (
      <div className="mx-auto max-w-md">
        <div className="navy-3d rounded-t-2xl px-6 py-6 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-primary-foreground/10">
            <Lock className="size-6" />
          </span>
          <h1 className="mt-3 text-xl font-bold">{title}</h1>
          <p className="mt-1 text-xs opacity-80">{description}</p>
        </div>
        <form
          className="surface-3d space-y-4 rounded-b-2xl p-6"
          onSubmit={(e) => {
            e.preventDefault();
            login.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email Admin</Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete={isFirstSetup ? "email" : "username"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@domain.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password Admin</Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete={isFirstSetup ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="press-3d w-full" disabled={login.isPending || !email.trim() || !password.trim()}>
            {buttonLabel}
          </Button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
