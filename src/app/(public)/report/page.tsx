import { ReportForm } from "@/components/forms/ReportForm";

export const metadata = { title: "Report a hazard" };

export default function ReportPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold">Report a hazard</h1>
        <p className="text-muted-foreground">Three short steps. You can stay exactly where you are.</p>
      </header>
      <ReportForm />
    </div>
  );
}
