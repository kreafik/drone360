"use client";

import { Menu } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

interface TopbarProps {
  email: string;
  fullName: string | null;
  onMenuClick: () => void;
}

function getInitials(name: string | null, email: string) {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return email[0].toUpperCase();
}

export function Topbar({ email, fullName, onMenuClick }: TopbarProps) {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const initials = getInitials(fullName, email);
  const displayName = fullName ?? email;

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="rounded-md p-2 text-muted-foreground hover:text-foreground transition-colors md:hidden"
        aria-label="Menüyü aç"
      >
        <Menu className="size-5" />
      </button>

      {/* Spacer — desktop'ta sol taraf sidebar kaplar */}
      <div className="hidden md:block" />

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Kullanıcı menüsü"
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-danger focus:text-danger focus:bg-danger/10 cursor-pointer"
          >
            Çıkış Yap
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
