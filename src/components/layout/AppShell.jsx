"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Play,
  Settings,
  Shield,
  Target,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { homePathForRole, roleLabel, ROLES } from "@/lib/roles";
import { HcsBrandNavbar } from "@/components/hcs-brand-navbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { href: "/", label: "Processor", icon: Play },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/settings",
    label: "Configuration",
    shortLabel: "Config",
    icon: Settings,
    adminOnly: true,
  },
  {
    href: "/strategy",
    label: "Strategy",
    icon: Target,
    adminOnly: true,
  },
  { href: "/users", label: "Users", icon: Shield, adminOnly: true },
];

function navItemsForRole(role) {
  return navItems.filter((item) => !item.adminOnly || role === ROLES.ADMIN);
}

function isActivePath(pathname, href) {
  if (href === "/") return pathname === "/";
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const chipClass = (active) =>
  cn(
    "inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border px-2 text-xs font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 lg:h-9 lg:gap-1.5 lg:px-2.5 xl:px-3 xl:text-sm",
    active
      ? "border-white/50 bg-white/25"
      : "border-white/30 bg-white/15 hover:border-white/50 hover:bg-white/25",
  );

function NavLabel({ label, shortLabel }) {
  return (
    <>
      <span className="hidden xl:inline">{label}</span>
      <span className="xl:hidden">{shortLabel || label}</span>
    </>
  );
}

export function AppShell({ children }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const items = navItemsForRole(user?.role);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  if (pathname === "/login") {
    return children;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <HcsBrandNavbar
        title="Price2GO"
        subtitle="HCS Pricing Hub"
        homeHref={homePathForRole(user?.role)}
        right={
          <div className="flex min-w-0 items-center justify-end gap-1.5">
            <nav
              className="hidden min-w-0 items-center gap-1 overflow-x-auto scrollbar-none lg:flex xl:gap-1.5"
              aria-label="Main"
            >
              {items.map((item) => {
                const { href, label, shortLabel, icon: Icon } = item;
                const active = isActivePath(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={chipClass(active)}
                    title={label}
                    aria-label={label}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <NavLabel label={label} shortLabel={shortLabel} />
                  </Link>
                );
              })}
            </nav>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    chipClass(false),
                    "hidden max-w-[12rem] lg:inline-flex",
                  )}
                  aria-label="Account menu"
                >
                  <span className="flex size-5 items-center justify-center rounded-full bg-white/25 text-[10px] font-bold">
                    {user.name?.charAt(0)?.toUpperCase() || "A"}
                  </span>
                  <span className="hidden min-w-0 truncate xl:inline">
                    {user.name}
                  </span>
                  <ChevronDown className="size-3.5 opacity-80" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-52">
                  <DropdownMenuLabel className="font-normal">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {user.name}
                    </p>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {roleLabel(user.role)}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={logout}>
                    <LogOut />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}

            <button
              type="button"
              className={cn(chipClass(menuOpen), "lg:hidden")}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? (
                <X className="size-4" />
              ) : (
                <Menu className="size-4" />
              )}
              <span className="sr-only">Menu</span>
            </button>
          </div>
        }
        bottom={
          menuOpen ? (
            <div className="lg:hidden">
              <button
                type="button"
                className="fixed inset-x-0 top-16 bottom-0 z-40 bg-black/40"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              />
              <div
                id="mobile-nav"
                className="relative z-50 border-t border-white/10 bg-[#2b1578]/95 px-4 py-4 backdrop-blur-md"
              >
                <nav className="flex flex-col gap-1" aria-label="Mobile">
                  {items.map((item) => {
                    const { href, label, icon: Icon } = item;
                    const active = isActivePath(pathname, href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={cn(
                          "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-white transition-colors",
                          active ? "bg-white/25" : "hover:bg-white/15",
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon className="size-4" />
                        {label}
                      </Link>
                    );
                  })}
                </nav>

                {user ? (
                  <div className="mt-4 border-t border-white/15 pt-4">
                    <div className="mb-2 flex items-center gap-3 px-3">
                      <span className="flex size-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                        {user.name?.charAt(0)?.toUpperCase() || "A"}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {user.name}
                        </p>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">
                          {roleLabel(user.role)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={logout}
                      className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-red-200 transition-colors hover:bg-white/10 hover:text-red-100"
                    >
                      <LogOut className="size-4" />
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null
        }
      />

      {children}
    </div>
  );
}
