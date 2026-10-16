"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  /** Match nested routes too (e.g. /cases/123 for /cases). */
  prefix?: boolean;
}

export function NavLink({ href, children, className, activeClassName = "bg-white/15 text-white", prefix }: NavLinkProps) {
  const pathname = usePathname();
  const active = prefix ? pathname.startsWith(href) : pathname === href;
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={cn(className, active && activeClassName)}>
      {children}
    </Link>
  );
}
