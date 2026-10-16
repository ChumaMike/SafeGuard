import Link from "next/link";
import { Phone, ShieldAlert, EyeOff, Lock } from "lucide-react";

export const metadata = { title: "Safety and emergency numbers" };

export default function SafetyPage() {
  return (
    <article className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold">Stay safe. Report from a distance.</h1>
        <p className="mt-2 text-muted-foreground">SafeGuard SA is not an emergency service. If someone is hurt or in danger right now, call for help first.</p>
      </header>

      <section aria-labelledby="emergency" className="rounded-xl border-2 border-status-red/40 bg-status-red-bg p-5">
        <h2 id="emergency" className="flex items-center gap-2 text-xl font-bold text-status-red">
          <Phone className="size-6" aria-hidden /> Emergency numbers
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          <li>
            <a href="tel:10177" className="tap flex items-center justify-between rounded-lg bg-background px-4 py-3 font-semibold hover:bg-accent">
              Ambulance / fire <span className="ref text-2xl">10177</span>
            </a>
          </li>
          <li>
            <a href="tel:112" className="tap flex items-center justify-between rounded-lg bg-background px-4 py-3 font-semibold hover:bg-accent">
              Any emergency (mobile) <span className="ref text-2xl">112</span>
            </a>
          </li>
          <li>
            <a href="tel:10111" className="tap flex items-center justify-between rounded-lg bg-background px-4 py-3 font-semibold hover:bg-accent">
              Police <span className="ref text-2xl">10111</span>
            </a>
          </li>
        </ul>
      </section>

      <section aria-labelledby="how" className="flex flex-col gap-3">
        <h2 id="how" className="flex items-center gap-2 text-xl font-bold">
          <ShieldAlert className="size-6 text-status-amber" aria-hidden /> How to report safely
        </h2>
        <ul className="list-disc space-y-2 ps-6">
          <li>Stay where you are. Take any photo from where you stand. Never go closer to the hazard to get a better picture.</li>
          <li>Never approach exposed electricity, open pits, unstable ground, water-filled holes or sewer openings.</li>
          <li>Keep children away and warn people walking past, but do not put yourself at risk to do so.</li>
          <li>Give a landmark everyone knows ("opposite the school gate") rather than a street number.</li>
          <li>Also report it to your municipality's call centre and keep their reference number. You can add it to your case.</li>
        </ul>
      </section>

      <section aria-labelledby="does" className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <h2 id="does" className="font-bold">What SafeGuard SA does</h2>
          <ul className="mt-2 list-disc space-y-1 ps-5 text-sm">
            <li>Gives your report a reference and a public status page.</li>
            <li>Tracks whether the hazard was made safe and whether it was fixed, as two separate verified outcomes.</li>
            <li>Shows how long people have gone unprotected since the first report on SafeGuard SA.</li>
            <li>Lets anyone add a community sighting: still open, barrier is there, barrier gone.</li>
          </ul>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-bold">What it does not do</h2>
          <ul className="mt-2 list-disc space-y-1 ps-5 text-sm">
            <li>It does not dispatch emergency services or a repair crew.</li>
            <li>It does not certify that a site is safe. Only the reviewer role can mark protection or a repair as verified, and the app records that decision.</li>
            <li>It does not replace your municipality's own reporting channels.</li>
            <li>It does not guarantee a repair time.</li>
          </ul>
        </div>
      </section>

      <section aria-labelledby="privacy" className="flex flex-col gap-3">
        <h2 id="privacy" className="flex items-center gap-2 text-xl font-bold">
          <Lock className="size-6" aria-hidden /> Privacy
        </h2>
        <ul className="list-disc space-y-2 ps-6">
          <li className="flex gap-2">
            <EyeOff className="mt-1 size-5 shrink-0 text-muted-foreground" aria-hidden />
            <span>The public page shows the category, suburb, status and clock. It never shows photos, names, phone numbers or exact coordinates.</span>
          </li>
          <li>Photos are shrunk on your phone and the server removes camera and location data (EXIF) before storing them. Only staff can view them.</li>
          <li>Your contact details are optional and visible to staff only.</li>
          <li>Please do not photograph people, and never ask children to report or to go near a hazard.</li>
          <li>This is a hackathon prototype with fictional demo data, built with the Protection of Personal Information Act in mind.</li>
        </ul>
      </section>

      <p>
        <Link href="/report" className="tap inline-flex items-center rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90">
          Report a hazard
        </Link>
      </p>
    </article>
  );
}
