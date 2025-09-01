import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { PaymentElement, useCheckout } from "@stripe/react-stripe-js";
import api from "@/lib/axios";

import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { PlanCard } from "@/components/custom/PlanCard";

function Form() {
  const { confirm } = useCheckout();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClick = () => {
    setLoading(true);
    confirm().then((result) => {
      if (result.type === "error") {
        setError(result.error);
      }
      setLoading(false);
    });
  };

  return (
    <form>
      <PaymentElement options={{ layout: "accordion" }} />

      <div>
        <Button
          type="submit"
          className="w-full mt-4"
          disabled={loading}
          onClick={handleClick}
        >
          Pagar
        </Button>
        {error && <div>{error.message}</div>}
      </div>
    </form>
  );
}

function CheckoutLazyElement({ selectedPlan, userId }) {
  const [error, setError] = useState("");

  let stripePromise: PromiseLike<Stripe> | null = null;

  const initializeStripe = async () => {
    if (!stripePromise) {
      stripePromise = loadStripe(import.meta.env.VITE_STRIPE_API_KEY || "");
    }
    return await stripePromise;
  };

  const stripe = initializeStripe();

  const fetchClientSecret = async () => {
    try {
      const response = await api.post(`/api/payment/create-checkout-session`, {
        priceId: selectedPlan,
        userId: userId,
      });

      return response.data.clientSecret;
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Não foi possível iniciar o pagamento.");
      }
      return null;
    }
  };

  return (
    <>
      <CheckoutProvider stripe={stripe} options={{ fetchClientSecret }}>
        <Form />
      </CheckoutProvider>
      {error && <p className="text-xl text-red-600 text-center">{error}</p>}
    </>
  );
}

export default function CheckoutForm() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const { user } = useUser();
  const userId = user ? user.id : searchParams.get("userId");

  useEffect(() => {
    const fetchPrices = async () => {
      const res = await fetch(
        import.meta.env.VITE_API_URL + "/api/payment/retrieve-products",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      const result = await res.json();
      setProducts(result.products.data);
    };

    //TODO: rework all this logic to make sense with the stripe wording
    const getUsersSubscriptions = async () => {
      const result = await api.get("/api/payment/get-user-subscriptions");

      const activeSubscription = result.data.find(
        (sub) => sub.status === "active" || sub.status === "trialing"
      );

      setSelectedPlan({
        ...activeSubscription.plan,
        default_price: {
          id: activeSubscription.plan.id,
        },
        id: activeSubscription.plan.product,
      });
    };

    if (user.customerId) {
      getUsersSubscriptions();
    }

    fetchPrices();
  }, [user]);

  return (
    <>
      <div>
        {products.map((product) => (
          <>
            <PlanCard
              product={product}
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
            />
          </>
        ))}
      </div>

      {selectedPlan && (
        <CheckoutLazyElement
          selectedPlan={selectedPlan.default_price.id}
          userId={userId}
        />
      )}

      {!user && (
        <div className="mt-4 text-center">
          <a href="/login" className="text-sm text-[#D4AF37] hover:underline">
            Já tem conta? Faça login aqui
          </a>
        </div>
      )}
    </>
  );
}
