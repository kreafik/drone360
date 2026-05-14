"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Users, Settings, LogOut, Compass, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isAdmin: boolean;
  onClose?: () => void;
}

const navItems = [
  { href: "/dashboard/projects", label: "Projeler", icon: LayoutGrid },
  { href: "/dashboard/settings", label: "Ayarlar", icon: Settings },
];

const adminItems = [
  { href: "/dashboard/users", label: "Kullanıcılar", icon: Users },
];

export function Sidebar({ isAdmin, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const allItems = isAdmin
    ? [...navItems.slice(0, 1), ...adminItems, ...navItems.slice(1)]
    : navItems;

  return (
    <div className="flex h-full flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-primary"
          onClick={onClose}
        >
          <Compass className="size-5" strokeWidth={1.5} />
          <span className="font-display text-lg lowercase tracking-tight">
            drone360
          </span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors md:hidden"
            aria-label="Menüyü kapat"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2 py-2">
        {allItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-11",
                isActive
                  ? "bg-sidebar-accent text-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={1.5} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-danger hover:bg-danger/10 min-h-11"
          onClick={handleLogout}
        >
          <LogOut className="size-4 shrink-0" strokeWidth={1.5} />
          <span className="text-sm font-medium">Çıkış Yap</span>
        </Button>
      </div>
    </div>
  );
}
