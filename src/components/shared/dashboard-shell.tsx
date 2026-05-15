"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

interface DashboardShellProps {
  children: React.ReactNode;
  email: string;
  fullName: string | null;
  isAdmin: boolean;
}

export function DashboardShell({
  children,
  email,
  fullName,
  isAdmin,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Sidebar — desktop: fixed, mobile: overlay */}
      <aside className="hidden w-60 shrink-0 md:block">
        <Sidebar isAdmin={isAdmin} />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-40 w-72 md:hidden">
            <Sidebar isAdmin={isAdmin} onClose={() => setSidebarOpen(false)} />
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          email={email}
          fullName={fullName}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
