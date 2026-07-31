import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { NAMA_SEKOLAH } from "@/lib/absensi";

const nav = [
  { to: "/", label: "Portal Orang Tua" },
  { to: "/absen", label: "Absen" },
  { to: "/admin", label: "Admin" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="navy-3d sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-primary-foreground/10 shadow-[inset_0_1px_0_oklch(1_0_0/0.35)]">
              <GraduationCap className="size-6" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-base font-bold sm:text-lg">E-Absensi</p>
              <p className="text-[11px] tracking-widest opacity-75">{NAMA_SEKOLAH}</p>
            </div>
          </div>
          <nav className="ml-auto flex items-center gap-1 rounded-xl bg-primary-foreground/10 p-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="press-3d rounded-lg px-3 py-1.5 text-xs font-semibold opacity-80 transition hover:opacity-100 sm:text-sm"
                activeProps={{
                  className:
                    "bg-primary-foreground text-primary opacity-100 shadow-[0_6px_14px_-6px_rgba(0,0,0,0.6)]",
                }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 pb-10 text-center text-xs text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} {NAMA_SEKOLAH} — Sistem E-Absensi
      </footer>
    </div>
  );
}
