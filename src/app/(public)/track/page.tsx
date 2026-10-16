import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { normaliseRef } from "@/server/domain/reference";

export const metadata = { title: "Track a report" };

async function lookup(formData: FormData) {
  "use server";
  const ref = normaliseRef(String(formData.get("ref") ?? ""));
  redirect(ref ? `/track/${ref}` : "/track?invalid=1");
}

export default async function TrackLookupPage({ searchParams }: { searchParams: Promise<{ invalid?: string }> }) {
  const { invalid } = await searchParams;
  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-bold">Track a report</h1>
        <p className="text-muted-foreground">Enter the reference from your confirmation or from a poster at the site.</p>
      </header>
      <form action={lookup} className="flex flex-col gap-3">
        <label htmlFor="ref" className="font-medium">Reference</label>
        <input
          id="ref"
          name="ref"
          required
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="SG-2026-0014"
          className="tap ref w-full rounded-xl border bg-background px-4 text-xl"
          aria-describedby={invalid ? "ref-err" : "ref-hint"}
        />
        <p id="ref-hint" className="text-sm text-muted-foreground">You can also just type the last digits, e.g. 0014.</p>
        {invalid && <p id="ref-err" role="alert" className="text-sm text-status-red">That does not look like a SafeGuard reference. Try SG-2026-0014.</p>}
        <button type="submit" className="tap inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-lg font-semibold text-primary-foreground hover:opacity-90">
          <Search className="size-5" aria-hidden /> Show status
        </button>
      </form>
    </div>
  );
}
