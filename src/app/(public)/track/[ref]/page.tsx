import Link from "next/link";
import { notFound } from "next/navigation";
import { Search } from "lucide-react";
import { TrackView } from "@/components/public/TrackView";
import { publicCaseByRef } from "@/server/services/publicCases";

export async function generateMetadata({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  return { title: `Track ${decodeURIComponent(ref)}` };
}

export default async function TrackPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const view = await publicCaseByRef(decodeURIComponent(ref));
  if (!view) notFound();

  return (
    <div className="flex flex-col gap-5">
      <TrackView initial={view} />
      <p className="text-sm">
        <Link href="/track" className="inline-flex items-center gap-1 underline">
          <Search className="size-4" aria-hidden /> Look up a different reference
        </Link>
      </p>
    </div>
  );
}
