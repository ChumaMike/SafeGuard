import Link from "next/link";
import { redirect } from "next/navigation";
import { CaseCard } from "@/components/case/CaseCard";
import { cn } from "@/lib/utils";
import { tabsFor } from "@/lib/ops-tabs";
import { ROLE_LABEL } from "@/lib/contracts/enums";
import { getCurrentUser } from "@/server/auth/session";
import { listCases } from "@/server/services/cases";

export const metadata = { title: "Home" };

export default async function HomePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const tabs = tabsFor(user.role);
  const { tab } = await searchParams;
  const active = tabs.find((t) => t.key === tab && !t.href) ?? tabs.find((t) => !t.href)!;
  const cases = await listCases({ statuses: active.statuses });

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-sm text-muted-foreground">
          Signed in as {user.displayName} · {ROLE_LABEL[user.role]}
        </p>
        <h1 className="text-2xl font-bold">Your work</h1>
      </header>

      <nav aria-label="Role tabs" className="flex gap-1 overflow-x-auto border-b">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.href ?? `/home?tab=${t.key}`}
            aria-current={t.key === active.key ? "page" : undefined}
            className={cn(
              "tap inline-flex items-center whitespace-nowrap border-b-2 px-4 font-medium",
              t.key === active.key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <p className="text-sm text-muted-foreground">{active.description}</p>

      {cases.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">Nothing here right now.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {cases.map((c) => (
            <li key={c.id}>
              <CaseCard c={c} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
