import { SchedulingCalendar } from "@/components/custom/SchedulingCalendar";
import { ProfessionalCommissionSummary } from "@/components/custom/ProfessionalCommissionSummary";
import { PendingExpensesNotification } from "@/components/custom/PendingExpensesNotification";
import { RecurringExpensesList } from "@/components/custom/RecurringExpensesList";

export default function Dashboard() {
  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A]">
        Dashboard
      </h1>
      <PendingExpensesNotification />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SchedulingCalendar />
        </div>
        <div>
          <RecurringExpensesList />
        </div>
      </div>
    </div>
  );
}
