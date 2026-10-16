"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PublicMapPoint } from "@/server/services/publicCases";
import { HAZARD_LABEL } from "@/lib/contracts/labels";
import { PROTECTION_LABEL, REPAIR_LABEL } from "@/lib/contracts/public-view";
import { clockLabel } from "@/lib/clock";

const GAUTENG_CENTRE: [number, number] = [-26.2, 27.95];

export function pinColour(p: PublicMapPoint): { fill: string; label: string } {
  if (p.public_status === "Resolved") return { fill: "#1B6E45", label: "Resolved (verified)" };
  if (p.protection === "verified") return { fill: "#1B6E45", label: "Made safe (verified)" };
  if (p.protection === "recorded") return { fill: "#8F5600", label: "Barrier recorded, not yet checked" };
  return { fill: "#B42323", label: "Unprotected" };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Leaflet map of approximate hazard pins. Tiles need internet; the pins and list do not. */
export function HazardMap({ points }: { points: PublicMapPoint[] }) {
  const el = useRef<HTMLDivElement>(null);
  const [tilesFailed, setTilesFailed] = useState(false);

  useEffect(() => {
    if (!el.current) return;
    const map = L.map(el.current, { center: GAUTENG_CENTRE, zoom: 11, scrollWheelZoom: false });
    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });
    tiles.on("tileerror", () => setTilesFailed(true));
    tiles.addTo(map);

    const withCoords = points.filter((p): p is PublicMapPoint & { lat: number; lng: number } => p.lat !== null && p.lng !== null);
    const group = L.featureGroup();
    for (const p of withCoords) {
      const { fill, label } = pinColour(p);
      const resolved = p.public_status === "Resolved";
      const marker = L.circleMarker([p.lat, p.lng], {
        radius: p.near_school ? 13 : 10,
        color: "#14202E",
        weight: resolved ? 1 : 2,
        fillColor: fill,
        fillOpacity: resolved ? 0.35 : 0.9,
      });
      const clock = clockLabel({ startedAt: p.clock.started_at, stoppedAt: p.clock.stopped_at });
      marker.bindPopup(
        `<div style="font:14px system-ui, sans-serif; line-height:1.35; min-width:220px">
          <div style="font-family:ui-monospace, monospace; color:#555">${escapeHtml(p.ref)}</div>
          <strong>${escapeHtml(HAZARD_LABEL[p.hazard_category] ?? p.hazard_category)}</strong><br>
          ${escapeHtml(p.landmark)} · ${escapeHtml(p.suburb)}${p.near_school ? " · <b>near a school</b>" : ""}<br>
          <span style="color:${fill}; font-weight:700">${escapeHtml(label)}</span><br>
          <span style="color:${p.clock.stopped_at ? "#1B6E45" : "#B42323"}">${escapeHtml(clock)}</span><br>
          <small>Protection: ${escapeHtml(PROTECTION_LABEL[p.protection])} · Repair: ${escapeHtml(REPAIR_LABEL[p.repair])}</small><br>
          <a href="/track/${encodeURIComponent(p.ref)}" style="color:#2459C9; font-weight:600">Open the public page →</a>
        </div>`,
      );
      marker.bindTooltip(`${p.ref} · ${label}`, { direction: "top" });
      marker.addTo(group);
    }
    group.addTo(map);
    if (withCoords.length > 0) map.fitBounds(group.getBounds().pad(0.25), { maxZoom: 14 });

    return () => {
      map.remove();
    };
  }, [points]);

  return (
    <div className="flex flex-col gap-2">
      <div ref={el} role="region" aria-label="Map of reported hazards" className="h-[440px] w-full overflow-hidden rounded-xl border bg-muted sm:h-[520px]" />
      {tilesFailed && (
        <p role="status" className="rounded-lg bg-status-amber-bg p-2 text-sm text-status-amber">
          Map tiles need an internet connection. The pins and the list below still work offline.
        </p>
      )}
    </div>
  );
}
