import { AuthPanel } from "@/components/custom/AuthPanel";

export default function Home() {
  return (
    <div className="flex h-screen w-screen">
      <div className="w-1/2 bg-[#FF5D73]" />

      <div className="w-1/2 bg-white">
        <AuthPanel />
      </div>
    </div>
  );
}
