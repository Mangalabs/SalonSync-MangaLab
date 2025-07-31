import { SchedulingCalendar } from "@/components/custom/SchedulingCalendar";
import { ProfessionalCommissionSummary } from "@/components/custom/ProfessionalCommissionSummary";

export default function Dashboard() {
  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A]">
        Dashboard
      </h1>
      <SchedulingCalendar />
    </div>
  );
}
