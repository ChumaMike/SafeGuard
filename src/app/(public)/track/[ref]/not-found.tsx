import Link from "next/link";

export default function TrackNotFound() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">No case with that reference</h1>
      <p className="text-muted-foreground">Check the reference on your confirmation or poster. It looks like SG-2026-0014.</p>
      <Link href="/track" className="tap inline-flex w-fit items-center rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">
        Try again
      </Link>
    </div>
  );
}
