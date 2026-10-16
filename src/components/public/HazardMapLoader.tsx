"use client";

import dynamic from "next/dynamic";
import type { PublicMapPoint } from "@/server/services/publicCases";

// Leaflet touches `window` at import time, so it is loaded on the client only.
const HazardMap = dynamic(() => import("./HazardMap").then((m) => m.HazardMap), {
  ssr: false,
  loading: () => <div className="h-[440px] w-full animate-pulse rounded-xl border bg-muted sm:h-[520px]" aria-busy="true" aria-label="Loading map" />,
});

export function HazardMapLoader({ points }: { points: PublicMapPoint[] }) {
  return <HazardMap points={points} />;
}
