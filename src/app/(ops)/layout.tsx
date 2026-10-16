import { redirect } from "next/navigation";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { OpsHeader } from "@/components/layout/OpsHeader";
import { isDemoMode } from "@/server/auth/demo";
import { getCurrentUser } from "@/server/auth/session";
import { can } from "@/server/domain/permissions";

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(1200px_400px_at_50%_-100px,rgba(36,89,201,0.08),transparent)]">
      <DemoBanner demoMode={isDemoMode()} currentRole={user.role} displayName={user.displayName} />
      <OpsHeader canSeeDashboard={can(user, "dashboard.view")} user={{ displayName: user.displayName, role: user.role }} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <footer className="no-print border-t px-4 py-3 text-center text-xs text-muted-foreground">
        Recorded is not verified. Only the reviewer role can verify protection or a repair. Hackathon prototype · all data fictional.
      </footer>
    </div>
  );
}
