import Link from "next/link";
import { LayoutDashboard, LogOut, MapPinned, TriangleAlert } from "lucide-react";
import { logoutAction } from "@/server/actions/auth";
import { ThemeToggle } from "./ThemeToggle";

interface OpsHeaderProps {
  canSeeDashboard: boolean;
}

export function OpsHeader({ canSeeDashboard }: OpsHeaderProps) {
  return (
    <header className="no-print border-b bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2">
        <Link href="/home" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-160.png" alt="" width={32} height={32} className="size-8 rounded-md" />
          <span className="font-bold">SafeGuard SA</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">· Safety operations</span>
        </Link>
        <nav aria-label="Operations" className="flex items-center gap-1 text-sm">
          <Link href="/home" className="tap inline-flex items-center rounded-md px-3 hover:bg-accent">
            Home
          </Link>
          {canSeeDashboard && (
            <Link href="/dashboard" className="tap inline-flex items-center gap-1 rounded-md px-3 hover:bg-accent">
              <LayoutDashboard className="size-4" aria-hidden /> Dashboard
            </Link>
          )}
          <Link href="/map" className="tap inline-flex items-center gap-1 rounded-md px-3 hover:bg-accent">
            <MapPinned className="size-4" aria-hidden /> Map
          </Link>
          <Link href="/report" className="tap inline-flex items-center gap-1 rounded-md px-3 hover:bg-accent">
            <TriangleAlert className="size-4" aria-hidden /> Report
          </Link>
          <ThemeToggle />
          <form action={logoutAction}>
            <button type="submit" className="tap inline-flex items-center gap-1 rounded-md px-3 hover:bg-accent" aria-label="Sign out">
              <LogOut className="size-4" aria-hidden /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
