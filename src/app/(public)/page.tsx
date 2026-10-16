import Link from "next/link";
import { Clock3, Search, ShieldCheck, TriangleAlert } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col items-start gap-4">
        <p className="inline-flex items-center gap-2 rounded-full bg-status-red-bg px-3 py-1 text-sm font-semibold text-status-red">
          <TriangleAlert className="size-4" aria-hidden /> A report is not protection
        </p>
        <h1 className="text-3xl font-bold leading-tight">
          See whether a hazard has been <span className="text-status-green">made safe</span>, not just reported.
        </h1>
        <p className="text-muted-foreground">
          Report an open manhole, sinkhole, exposed cable or sewage leak from a safe distance. SafeGuard SA tracks two things
          separately: was it made safe, and was it fixed. Nothing turns green until an authorised reviewer checks it, and a
          clock shows how long people have been left unprotected.
        </p>
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Link
            href="/report"
            className="tap inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-lg font-semibold text-primary-foreground hover:opacity-90"
          >
            <TriangleAlert className="size-5" aria-hidden /> Report a hazard
          </Link>
          <Link
            href="/track"
            className="tap inline-flex flex-1 items-center justify-center gap-2 rounded-xl border px-5 py-3 text-lg font-semibold hover:bg-accent"
          >
            <Search className="size-5" aria-hidden /> Track a report
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <Clock3 className="mb-2 size-6 text-status-red" aria-hidden />
          <h2 className="font-semibold">The protection clock</h2>
          <p className="text-sm text-muted-foreground">Counts from the first report until a reviewer verifies the barrier. It restarts if the barrier disappears.</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <ShieldCheck className="mb-2 size-6 text-status-green" aria-hidden />
          <h2 className="font-semibold">Made safe vs fixed</h2>
          <p className="text-sm text-muted-foreground">Two outcomes, two verifications. A barrier that was recorded is not a barrier that was checked.</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <Search className="mb-2 size-6 text-action" aria-hidden />
          <h2 className="font-semibold">Public, by reference</h2>
          <p className="text-sm text-muted-foreground">Anyone with the reference sees the status and can say "still open" or "barrier gone". No photos or names are shown.</p>
        </div>
      </section>
    </div>
  );
}
