import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NavLink } from "@/components/layout/NavLink";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-shell flex min-h-dvh flex-col">
      <header className="no-print sticky top-0 z-20 bg-navy text-white shadow-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-160.png" alt="" width={40} height={40} className="size-10 rounded-md bg-white p-0.5" />
            <span className="leading-tight">
              <span className="block text-base font-bold">SafeGuard SA</span>
              <span className="block text-xs text-white/70">Safety near you</span>
            </span>
          </Link>
          <nav aria-label="Public" className="flex items-center gap-1 text-sm">
            <NavLink href="/report" prefix className="tap inline-flex items-center rounded-lg px-3 text-white/85 hover:bg-white/10 hover:text-white">Report</NavLink>
            <NavLink href="/track" prefix className="tap inline-flex items-center rounded-lg px-3 text-white/85 hover:bg-white/10 hover:text-white">Track</NavLink>
            <NavLink href="/map" prefix className="tap inline-flex items-center rounded-lg px-3 text-white/85 hover:bg-white/10 hover:text-white">Map</NavLink>
            <NavLink href="/safety" prefix className="tap inline-flex items-center rounded-lg px-3 text-white/85 hover:bg-white/10 hover:text-white">Safety</NavLink>
            <ThemeToggle className="tap inline-flex items-center justify-center rounded-md text-white hover:bg-white/10" />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</main>
      <footer className="no-print border-t">
        <div className="mx-auto max-w-2xl px-4 py-5 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">A report is not protection. Recorded is not verified.</p>
          <p className="mt-1">
            SafeGuard SA records and tracks. It does not certify safety or replace municipal or emergency services. In an
            emergency call <a className="underline" href="tel:10177">10177</a> or <a className="underline" href="tel:112">112</a>.
          </p>
          <p className="mt-2 text-xs">
            Hackathon prototype · all data is fictional ·{" "}
            <Link className="underline" href="/login">
              Staff sign-in
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
