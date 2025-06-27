import { SchedulingCalendar } from "@/components/custom/SchedulingCalendar";

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[#FF5D73]">
        Dashboard
      </h1>
      <SchedulingCalendar />
    </div>
  );
}
