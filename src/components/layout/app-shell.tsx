"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  Upload,
  Database,
  User,
  Users,
  FileText,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, type UserRole } from "@/context/AuthContext";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  /** Roles allowed to see this item. undefined = all roles */
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/submission", label: "Pengajuan Data", icon: Upload },
  { href: "/tower-records", label: "Data Menara", icon: Database },
  {
    href: "/audit-logs",
    label: "Log Audit",
    icon: FileText,
    roles: ["MANAGER", "ADMIN"],
  },
  {
    href: "/user_management",
    label: "Manajemen Pengguna",
    icon: Users,
    roles: ["ADMIN"],
  },
  { href: "/account", label: "Akun", icon: User },
];

function NavItems({
  collapsed,
  pathname,
  visibleItems,
}: {
  collapsed: boolean;
  pathname: string | null;
  visibleItems: NavItem[];
}) {
  return (
    <>
      {visibleItems.map(({ href, label, icon: Icon }) => {
        const active = pathname !== null && pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            title={collapsed ? label : undefined}
            className={cn(
              "flex h-10 items-center gap-3 rounded-card px-3 text-base transition-colors duration-150",
              active
                ? "bg-nav-active-bg font-semibold text-primary"
                : "text-heading hover:bg-canvas"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            {!collapsed && <span>{label}</span>}
          </Link>
        );
      })}
    </>
  );
}

function ActiveNavItems({
  collapsed,
  visibleItems,
}: {
  collapsed: boolean;
  visibleItems: NavItem[];
}) {
  const pathname = usePathname();
  return (
    <NavItems
      collapsed={collapsed}
      pathname={pathname}
      visibleItems={visibleItems}
    />
  );
}

const ROLE_DISPLAY: Record<string, string> = {
  "Normal User": "Pengguna",
  "Web Manager": "Manajer Web",
  "Super Admin": "Super Admin",
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, authenticated, loading, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user.role)
  );

  useEffect(() => {
    if (!loading && !authenticated) router.replace("/");
  }, [authenticated, loading, router]);

  if (loading || !authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-sm text-muted">
        Memeriksa sesi akun...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <a href="#main-content" className="skip-link">
        Lewati ke konten utama
      </a>

      {/* ───── Header ───── */}
      <header className="sticky top-0 z-[100] flex h-[var(--header-height)] w-full items-center justify-between bg-primary px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-input bg-white p-0.5">
            <Image
              src="/logokomdigi.png"
              alt="Komdigi logo"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>
          <span className="text-xl font-bold text-on-primary">
            Infrastruktur Pasif
          </span>
        </Link>

        <div className="flex items-center gap-2 text-on-primary">
            <User className="h-4 w-4" strokeWidth={2} />
            <span className="text-sm font-semibold">
              {ROLE_DISPLAY[user.roleLabel] || user.roleLabel}
            </span>
            <span className="hidden text-sm text-on-primary/80 sm:inline">{user.name}</span>
        </div>
      </header>

      {/* ───── Body ───── */}
      <div className="flex flex-1">
        <aside
          className={cn(
            "sticky top-[var(--header-height)] z-50 flex h-[calc(100vh-var(--header-height))] shrink-0 flex-col border-r border-border-soft bg-surface transition-all duration-200",
            collapsed ? "w-16" : "w-[var(--sidebar-width)]"
          )}
        >
          <nav
            aria-label="Navigasi Utama"
            className="flex flex-1 flex-col gap-1 px-2 py-4"
          >
            <Suspense
              fallback={
                <NavItems
                  collapsed={collapsed}
                  pathname={null}
                  visibleItems={visibleItems}
                />
              }
            >
              <ActiveNavItems
                collapsed={collapsed}
                visibleItems={visibleItems}
              />
            </Suspense>
            <button
              type="button"
              onClick={async () => {
                setLogoutError("");
                try {
                  await logout();
                  router.push("/");
                } catch (error) {
                  setLogoutError(
                    error instanceof Error ? error.message : "Keluar dari akun gagal.",
                  );
                }
              }}
              title={collapsed ? "Keluar" : undefined}
              className={cn(
                "mt-1 flex h-10 items-center gap-3 rounded-card px-3 text-base text-logout transition-colors duration-150 hover:bg-danger-bg",
                collapsed && "justify-center"
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" strokeWidth={2} />
              {!collapsed && <span>Keluar</span>}
            </button>
            {logoutError && <p role="alert" className="px-3 text-xs text-danger">{logoutError}</p>}
          </nav>

          <div className="border-t border-border-soft px-3 py-3">
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="flex items-center gap-2 text-sm text-muted hover:text-heading"
            >
              <ChevronLeft
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  collapsed && "rotate-180"
                )}
                strokeWidth={2}
              />
              {!collapsed && <span>Sembunyikan menu</span>}
            </button>
            {!collapsed && (
              <div className="mt-2 text-2xs text-faint">
                <p>Versi Aplikasi 0.1</p>
                <p>Hak Cipta © 2026</p>
              </div>
            )}
          </div>
        </aside>

        <main id="main-content" className="min-w-0 flex-1 px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
