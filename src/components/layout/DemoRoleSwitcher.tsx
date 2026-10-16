"use client";

import { useTransition } from "react";
import { usePathname } from "next/navigation";
import { ROLE_LABEL, StaffRole } from "@/lib/contracts/enums";
import { demoSwitchRole } from "@/server/actions/auth";

export function DemoRoleSwitcher({ currentRole }: { currentRole: StaffRole }) {
  const [pending, start] = useTransition();
  const pathname = usePathname();
  return (
    <label className="inline-flex items-center gap-2">
      <span className="sr-only">Switch demo role</span>
      <select
        className="tap rounded-md border border-navy/30 bg-white px-2 text-sm text-navy"
        value={currentRole}
        disabled={pending}
        onChange={(e) => {
          const role = e.target.value;
          start(async () => {
            await demoSwitchRole(role, pathname.startsWith("/cases/") ? pathname : "/home");
          });
        }}
      >
        {StaffRole.options.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABEL[r]}
          </option>
        ))}
      </select>
    </label>
  );
}
