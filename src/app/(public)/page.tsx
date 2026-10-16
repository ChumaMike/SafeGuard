import Link from "next/link";
import { Clock3, MapPinned, Search, ShieldCheck, TriangleAlert } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <section className="hero-gradient relative overflow-hidden rounded-3xl p-6 text-white shadow-lg sm:p-8">
        <div className="hazard-stripes absolute inset-x-0 top-0 h-2" aria-hidden />
        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-brand ring-1 ring-white/15">
          <TriangleAlert className="size-4" aria-hidden /> A report is not protection
        </p>
        <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
          See whether a hazard has been <span className="text-brand">made safe</span>, not just reported.
        </h1>
        <p className="mt-3 max-w-prose text-white/80">
          Report an open manhole, sinkhole, exposed cable or sewage leak from a safe distance. SafeGuard SA tracks two things
          separately: was it made safe, and was it fixed. Nothing turns green until an authorised reviewer checks it, and a
          clock shows how long people have been left unprotected.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/report"
            className="tap inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-lg font-semibold text-navy shadow hover:brightness-105"
          >
            <TriangleAlert className="size-5" aria-hidden /> Report a hazard
          </Link>
          <Link
            href="/track"
            className="tap inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-lg font-semibold text-white hover:bg-white/15"
          >
            <Search className="size-5" aria-hidden /> Track a report
          </Link>
        </div>
        <Link href="/map" className="tap mt-3 inline-flex items-center gap-2 font-semibold text-white/90 hover:text-white hover:underline">
          <MapPinned className="size-5" aria-hidden /> See the hazards near you on the map
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-status-red-bg text-status-red"><Clock3 className="size-5" aria-hidden /></span>
          <h2 className="font-semibold">The protection clock</h2>
          <p className="text-sm text-muted-foreground">Counts from the first report until a reviewer verifies the barrier. It restarts if the barrier disappears.</p>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-status-green-bg text-status-green"><ShieldCheck className="size-5" aria-hidden /></span>
          <h2 className="font-semibold">Made safe vs fixed</h2>
          <p className="text-sm text-muted-foreground">Two outcomes, two verifications. A barrier that was recorded is not a barrier that was checked.</p>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-action/10 text-action"><Search className="size-5" aria-hidden /></span>
          <h2 className="font-semibold">Public, by reference</h2>
          <p className="text-sm text-muted-foreground">Anyone with the reference sees the status and can say "still open" or "barrier gone". No photos or names are shown.</p>
        </div>
      </section>
    </div>
  );
}
