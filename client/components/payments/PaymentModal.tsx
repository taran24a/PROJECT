import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Shield, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Load Stripe
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_your_key_here");

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  investmentData: {
    symbol: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
    type: string;
    sector: string;
  };
  onSuccess: (investment: any) => void;
}

interface PaymentFormProps {
  investmentData: PaymentModalProps['investmentData'];
  onSuccess: (investment: any) => void;
  onClose: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ investmentData, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      // Create payment intent
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': '507f1f77bcf86cd799439011' // Mock user ID
        },
        body: JSON.stringify({
          amount: investmentData.total,
          currency: 'inr',
          symbol: investmentData.symbol,
          name: investmentData.name,
          quantity: investmentData.quantity,
          type: investmentData.type,
          sector: investmentData.sector
        })
      });

      const { clientSecret } = await response.json();

      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (error) {
        setPaymentStatus('error');
        toast.error(`Payment failed: ${error.message}`);
      } else if (paymentIntent.status === 'succeeded') {
        // Confirm payment on our server
        const confirmResponse = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'user-id': '507f1f77bcf86cd799439011'
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id
          })
        });

        const confirmData = await confirmResponse.json();

        if (confirmData.success) {
          setPaymentStatus('success');
          toast.success('Investment completed successfully!');
          onSuccess(confirmData.investment);
          setTimeout(() => onClose(), 2000);
        } else {
          setPaymentStatus('error');
          toast.error('Failed to create investment record');
        }
      }
    } catch (error) {
      setPaymentStatus('error');
      toast.error('Payment processing failed');
      console.error('Payment error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Investment Summary */}
      <div className="bg-white/5 rounded-xl p-4 space-y-2">
        <h3 className="font-semibold text-lg">Investment Summary</h3>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Symbol:</span>
          <span className="font-medium">{investmentData.symbol}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Quantity:</span>
          <span className="font-medium">{investmentData.quantity} shares</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Price per share:</span>
          <span className="font-medium">₹{investmentData.price.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t border-white/10 pt-2">
          <span>Total Amount:</span>
          <span className="text-purple-accent">₹{investmentData.total.toLocaleString()}</span>
        </div>
      </div>

      {/* Payment Form */}
      <div className="space-y-4">
        <Label htmlFor="card-element" className="text-sm font-medium">
          Card Details
        </Label>
        <div className="p-4 border border-white/10 rounded-xl bg-white/5">
          <CardElement
            id="card-element"
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#ffffff',
                  '::placeholder': {
                    color: '#a0a0a0',
                  },
                },
                invalid: {
                  color: '#ff6b6b',
                },
              },
            }}
          />
        </div>
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
        <div className="text-sm text-blue-300">
          <p className="font-medium">Secure Payment</p>
          <p className="text-blue-400/80">Your payment information is encrypted and secure. We never store your card details.</p>
        </div>
      </div>

      {/* Payment Status */}
      <AnimatePresence>
        {paymentStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl"
          >
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium">Payment Successful!</span>
          </motion.div>
        )}

        {paymentStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
          >
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-medium">Payment Failed. Please try again.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1"
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-purple-primary hover:bg-purple-primary/90"
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay ₹{investmentData.total.toLocaleString()}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, investmentData, onSuccess }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Complete Investment</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <Elements stripe={stripePromise}>
            <PaymentForm
              investmentData={investmentData}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          </Elements>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentModal;