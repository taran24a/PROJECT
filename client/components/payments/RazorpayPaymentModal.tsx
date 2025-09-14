import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Shield, CheckCircle, AlertCircle, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Load Razorpay script
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayPaymentModalProps {
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

const RazorpayPaymentModal: React.FC<RazorpayPaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  investmentData, 
  onSuccess 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpay = () => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          setRazorpayLoaded(true);
          resolve(true);
        };
        script.onerror = () => {
          console.error('Failed to load Razorpay');
          resolve(false);
        };
        document.body.appendChild(script);
      });
    };

    if (isOpen && !razorpayLoaded) {
      loadRazorpay();
    }
  }, [isOpen, razorpayLoaded]);

  const handlePayment = async () => {
    if (!window.Razorpay) {
      toast.error('Payment system not loaded. Please try again.');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      // Create Razorpay order
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': '507f1f77bcf86cd799439011' // Mock user ID
        },
        body: JSON.stringify({
          amount: investmentData.total,
          currency: 'INR',
          symbol: investmentData.symbol,
          name: investmentData.name,
          quantity: investmentData.quantity,
          type: investmentData.type,
          sector: investmentData.sector
        })
      });

      const orderData = await response.json();

      if (!orderData.orderId) {
        throw new Error('Failed to create payment order');
      }

      // Razorpay options
      const options = {
        key: process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_your_key_here',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'FinanceFlow',
        description: `Investment in ${investmentData.symbol} - ${investmentData.name}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment on server
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'user-id': '507f1f77bcf86cd799439011'
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              setPaymentStatus('success');
              toast.success('Investment completed successfully!');
              onSuccess(verifyData.investment);
              setTimeout(() => onClose(), 2000);
            } else {
              setPaymentStatus('error');
              toast.error('Payment verification failed');
            }
          } catch (error) {
            setPaymentStatus('error');
            toast.error('Payment verification failed');
            console.error('Payment verification error:', error);
          }
        },
        prefill: {
          name: 'Investor',
          email: 'investor@example.com',
          contact: '+91 9876543210'
        },
        theme: {
          color: '#8B5CF6'
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            setPaymentStatus('idle');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      setPaymentStatus('error');
      toast.error('Payment processing failed');
      console.error('Payment error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

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

          {/* Investment Summary */}
          <div className="bg-white/5 rounded-xl p-4 space-y-2 mb-6">
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

          {/* Payment Methods */}
          <div className="space-y-4 mb-6">
            <h3 className="font-semibold">Payment Methods</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border border-white/10 rounded-xl bg-white/5 text-center">
                <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                <p className="text-sm">Cards</p>
              </div>
              <div className="p-3 border border-white/10 rounded-xl bg-white/5 text-center">
                <Smartphone className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <p className="text-sm">UPI</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border border-white/10 rounded-xl bg-white/5 text-center">
                <div className="w-8 h-8 mx-auto mb-2 bg-orange-400 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">NB</span>
                </div>
                <p className="text-sm">Net Banking</p>
              </div>
              <div className="p-3 border border-white/10 rounded-xl bg-white/5 text-center">
                <div className="w-8 h-8 mx-auto mb-2 bg-purple-400 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">WL</span>
                </div>
                <p className="text-sm">Wallets</p>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-6">
            <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-medium">Secure Payment</p>
              <p className="text-blue-400/80">Your payment is processed securely by Razorpay. We never store your payment details.</p>
            </div>
          </div>

          {/* Payment Status */}
          <AnimatePresence>
            {paymentStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl mb-4"
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
                className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4"
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
              onClick={handlePayment}
              className="flex-1 bg-purple-primary hover:bg-purple-primary/90"
              disabled={!razorpayLoaded || isProcessing}
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RazorpayPaymentModal;