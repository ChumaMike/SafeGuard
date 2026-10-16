import Link from "next/link";
import { LayoutDashboard, LogOut, MapPinned, TriangleAlert, ListChecks } from "lucide-react";
import type { StaffRole } from "@/lib/contracts/labels";
import { logoutAction } from "@/server/actions/auth";
import { NavLink } from "./NavLink";
import { ThemeToggle } from "./ThemeToggle";
import { UserPill } from "./UserPill";

interface OpsHeaderProps {
  canSeeDashboard: boolean;
  user: { displayName: string; role: StaffRole };
}

const link = "tap inline-flex items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground";
const active = "bg-navy/8 text-foreground dark:bg-white/10";

export function OpsHeader({ canSeeDashboard, user }: OpsHeaderProps) {
  return (
    <header className="no-print sticky top-0 z-20 border-b bg-card/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
        <Link href="/home" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-160.png" alt="" width={36} height={36} className="size-9 rounded-lg" />
          <span className="leading-tight">
            <span className="block font-bold">SafeGuard SA</span>
            <span className="hidden text-xs text-muted-foreground sm:block">Safety operations</span>
          </span>
        </Link>

        <nav aria-label="Operations" className="hidden items-center gap-1 md:flex">
          <NavLink href="/home" className={link} activeClassName={active}>
            <ListChecks className="size-4" aria-hidden /> My work
          </NavLink>
          {canSeeDashboard && (
            <NavLink href="/dashboard" className={link} activeClassName={active}>
              <LayoutDashboard className="size-4" aria-hidden /> Dashboard
            </NavLink>
          )}
          <NavLink href="/map" className={link} activeClassName={active}>
            <MapPinned className="size-4" aria-hidden /> Map
          </NavLink>
          <NavLink href="/report" className={link} activeClassName={active}>
            <TriangleAlert className="size-4" aria-hidden /> Report
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <UserPill displayName={user.displayName} role={user.role} />
          <ThemeToggle />
          <form action={logoutAction}>
            <button type="submit" className="tap inline-flex items-center gap-1 rounded-lg px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Sign out">
              <LogOut className="size-4" aria-hidden /> <span className="hidden lg:inline">Sign out</span>
            </button>
          </form>
        </div>
      </div>
      <nav aria-label="Operations (mobile)" className="flex items-center gap-1 overflow-x-auto border-t px-2 py-1 md:hidden">
        <NavLink href="/home" className={link} activeClassName={active}>My work</NavLink>
        {canSeeDashboard && <NavLink href="/dashboard" className={link} activeClassName={active}>Dashboard</NavLink>}
        <NavLink href="/map" className={link} activeClassName={active}>Map</NavLink>
        <NavLink href="/report" className={link} activeClassName={active}>Report</NavLink>
      </nav>
    </header>
  );
}
