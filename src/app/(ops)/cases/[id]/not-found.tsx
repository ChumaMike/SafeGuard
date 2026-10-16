import Link from "next/link";

export default function CaseNotFound() {
  return (
    <div className="rounded-xl border border-dashed p-6">
      <h1 className="text-xl font-bold">Case not found</h1>
      <p className="mt-1 text-muted-foreground">
        It may have been removed by a demo reset. <Link href="/home" className="underline">Back to your work</Link>.
      </p>
    </div>
  );
}
