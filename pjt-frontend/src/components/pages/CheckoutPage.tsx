import CheckoutForm from "@/components/pages/CheckoutForm";

export default function CheckoutPage() {
  return (
    <div className="w-full h-screen mx-auto flex flex-col items-center content-center">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[#1A1A1A]">SalonSync</h2>
      </div>
      <CheckoutForm />
    </div>
  );
}
