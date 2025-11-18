"use client";

import { useState, useEffect } from "react";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { API_BASE_URL } from "@/lib/config";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

type StripeCheckoutProps = {
  amount: number;
  email: string;
  items: Array<{ id: string; quantity: number }>;
  onSuccess: (orderId: string, stockUpdates?: Array<{ productId: string; newStock: number }>) => void;
  onError: (error: string) => void;
  token?: string | null;
};

type CheckoutFormProps = StripeCheckoutProps & {
  clientSecret: string;
};

function CheckoutForm({
  amount,
  email,
  items,
  onSuccess,
  onError,
  token,
  clientSecret,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Confirm payment with Stripe using PaymentElement
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
          payment_method_data: {
            billing_details: {
              email,
            },
          },
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "Payment failed");
        onError(error.message || "Payment failed");
        setIsProcessing(false);
        return;
      }

      if (paymentIntent.status === "succeeded") {
        // Confirm payment on backend and reduce stock
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const confirmResponse = await fetch(
          `${API_BASE_URL}/api/payment/confirm`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
            }),
          }
        );

        if (!confirmResponse.ok) {
          const errorData = await confirmResponse.json().catch(() => ({}));
          throw new Error(
            errorData.error || "Payment succeeded but order confirmation failed"
          );
        }

        const confirmData = await confirmResponse.json();
        // Pass stock updates to success handler
        const stockUpdates = confirmData.stockUpdates?.map((update: { productId: string; newStock: number }) => ({
          productId: update.productId,
          newStock: update.newStock,
        })) || [];
        onSuccess(confirmData.orderId, stockUpdates);
      }
    } catch (error) {
      console.error("Payment error:", error);
      const message =
        error instanceof Error ? error.message : "Payment processing failed";
      setErrorMessage(message);
      onError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-slate-600">Initializing payment...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4 overflow-visible">
        <PaymentElement />
      </div>

      {errorMessage && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
      >
        {isProcessing ? "Processing..." : `Pay ${new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount)}`}
      </button>

      <p className="text-xs text-slate-500 text-center">
        Test Mode: Use card 4242 4242 4242 4242, any future date, any CVC
      </p>
    </form>
  );
}

export function StripeCheckout(props: StripeCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      // Validate items before creating payment intent
      if (!props.items || !Array.isArray(props.items) || props.items.length === 0) {
        props.onError("Cart is empty. Please add items to your cart before checkout.");
        return;
      }

      try {
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (props.token) {
          headers.Authorization = `Bearer ${props.token}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/payment/create-intent`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            email: props.email,
            items: props.items,
          }),
        });

        if (!response.ok) {
          // Try to get error message from response
          let errorMessage = "Failed to create payment intent";
          const contentType = response.headers.get("content-type");
          
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json().catch(() => ({}));
            errorMessage = errorData.error || errorData.message || `Server error (${response.status})`;
            console.error("Payment intent creation failed:", errorData);
          } else {
            // Response is not JSON, get text
            const text = await response.text().catch(() => "");
            errorMessage = text || `Server error (${response.status} ${response.statusText})`;
            
            // Log detailed error information
            console.error("Payment intent creation failed - non-JSON response");
            console.error("Status:", response.status);
            console.error("Status Text:", response.statusText);
            console.error("Response Body:", text.substring(0, 500));
            console.error("Response Headers:", Object.fromEntries(response.headers.entries()));
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error("Error creating payment intent:", error);
        
        // Handle network errors
        if (error instanceof TypeError && error.message.includes("fetch")) {
          props.onError(
            `Cannot connect to backend server. Make sure it's running on ${API_BASE_URL}`
          );
          return;
        }
        
        props.onError(
          error instanceof Error
            ? error.message
            : "Failed to initialize payment"
        );
      }
    };

    // Only create payment intent if items are available
    if (props.items && props.items.length > 0) {
      createPaymentIntent();
    }
  }, [props.email, props.items, props.token, props.onError]);

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "stripe",
    },
  };

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-slate-600">Initializing payment...</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm {...props} clientSecret={clientSecret} />
    </Elements>
  );
}

