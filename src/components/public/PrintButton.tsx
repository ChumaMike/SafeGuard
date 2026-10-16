"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="tap inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground hover:opacity-90"
    >
      <Printer className="size-5" aria-hidden /> Print A4
    </button>
  );
}
