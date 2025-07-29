import { AuthPanel } from "@/components/custom/AuthPanel";

export default function Home() {
  return (
    <div className="flex h-screen w-screen">
      <div className="w-1/2 bg-primary" />

      <div className="w-1/2 bg-[#F5F5F0]">
        <AuthPanel />
      </div>
    </div>
  );
}
