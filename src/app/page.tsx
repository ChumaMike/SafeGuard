import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 p-6">
      <h1 className="text-3xl font-bold">SafeGuard SA</h1>
      <p className="text-lg">
        A report is not protection, and recorded is not verified. SafeGuard SA shows whether a
        hazard has been made safe while it waits to be fixed, and how long people have gone
        unprotected.
      </p>
      <nav className="flex flex-col gap-3">
        <Link className="underline" href="/report">Report a hazard</Link>
        <Link className="underline" href="/track">Track a report</Link>
        <Link className="underline" href="/safety">Safety and emergency numbers</Link>
        <Link className="underline" href="/login">Staff login</Link>
      </nav>
      <p className="text-sm opacity-70">Prototype. All data is fictional.</p>
    </main>
  );
}
