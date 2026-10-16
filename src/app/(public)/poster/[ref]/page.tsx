import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { HAZARD_LABEL } from "@/lib/contracts/enums";
import { PROTECTION_LABEL } from "@/lib/contracts/public-view";
import { normaliseRef } from "@/server/domain/reference";
import { getCaseByRef } from "@/server/services/cases";
import { toPublicView } from "@/server/domain/publicView";
import { PrintButton } from "@/components/public/PrintButton";

export async function generateMetadata({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  return { title: `Poster ${decodeURIComponent(ref)}` };
}

export default async function PosterPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref: raw } = await params;
  const ref = normaliseRef(decodeURIComponent(raw));
  if (!ref) notFound();
  const c = await getCaseByRef(ref);
  if (!c) notFound();
  const view = toPublicView(c);

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") || host.startsWith("192.") || host.startsWith("172.") ? "http" : "https");
  const trackUrl = `${proto}://${host}/track/${ref}`;
  const qr = await QRCode.toString(trackUrl, { type: "svg", margin: 1, width: 360, errorCorrectionLevel: "M" });

  const protectionLine =
    view.protection === "verified"
      ? "PROTECTION VERIFIED"
      : view.protection === "recorded"
        ? "BARRIER RECORDED — NOT YET VERIFIED"
        : "NOT MADE SAFE";
  const protectionClass =
    view.protection === "verified" ? "text-status-green" : view.protection === "recorded" ? "text-status-amber" : "text-status-red";

  return (
    <div className="flex flex-col gap-4">
      <div className="no-print flex items-center justify-between">
        <h1 className="text-xl font-bold">Printable poster</h1>
        <PrintButton />
      </div>

      <article aria-label={`Site poster for ${ref}`} className="mx-auto w-full max-w-[190mm] rounded-xl border bg-white text-black shadow print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        <div className="hazard-stripes h-6 rounded-t-xl print:rounded-none" aria-hidden />
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          <p className="text-4xl font-black tracking-wide text-status-red">DANGER</p>
          <p className="text-3xl font-bold uppercase">{HAZARD_LABEL[view.hazard_category] ?? view.hazard_category}</p>
          <p className="text-lg">
            {c.landmark} · {view.suburb}
          </p>

          <p className={`text-2xl font-extrabold ${protectionClass}`}>{protectionLine}</p>
          <p className="text-sm">
            Interim protection: <strong>{PROTECTION_LABEL[view.protection]}</strong>
          </p>

          <div className="mx-auto w-56" dangerouslySetInnerHTML={{ __html: qr }} aria-label={`QR code linking to ${trackUrl}`} role="img" />
          <p className="ref text-4xl font-bold">{ref}</p>
          <p className="max-w-sm text-sm">
            Scan to see the live status, or to report that the barrier is gone or the hole is still open. Or go to{" "}
            <span className="ref break-all">{trackUrl}</span>
          </p>

          <p className="mt-2 text-xs text-neutral-600">
            Keep children away. Do not approach. Emergency: 10177 or 112. SafeGuard SA records and tracks; it does not certify safety. Hackathon prototype · fictional data.
          </p>
        </div>
        <div className="hazard-stripes h-6 rounded-b-xl print:rounded-none" aria-hidden />
      </article>
    </div>
  );
}
