import CheckoutForm from "@/components/pages/CheckoutForm";

export function SubscriptionManagement() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[#1A1A1A]">SalonSync</h2>
      </div>
      <CheckoutForm />
    </div>
  );
}
