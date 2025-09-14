import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  CreditCard, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Smartphone,
  Building2,
  Wallet,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface SimplePaymentModalProps {
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

const SimplePaymentModal: React.FC<SimplePaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  investmentData, 
  onSuccess 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchPaymentMethods();
    }
  }, [isOpen]);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payments/methods');
      const data = await response.json();
      setPaymentMethods(data.paymentMethods || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      // Create payment order
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': '507f1f77bcf86cd799439011'
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

      const orderData = await orderResponse.json();

      if (orderData.orderId) {
        // Simulate payment success (in production, integrate with actual payment gateway)
        setTimeout(async () => {
          try {
            const successResponse = await fetch('/api/payments/simulate-success', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'user-id': '507f1f77bcf86cd799439011'
              },
              body: JSON.stringify({
                orderId: orderData.orderId,
                symbol: investmentData.symbol,
                name: investmentData.name,
                quantity: investmentData.quantity,
                type: investmentData.type,
                sector: investmentData.sector,
                amount: investmentData.total
              })
            });

            const successData = await successResponse.json();

            if (successData.success) {
              setPaymentStatus('success');
              toast.success('Investment completed successfully!');
              onSuccess(successData.investment);
              setTimeout(() => onClose(), 2000);
            } else {
              setPaymentStatus('error');
              toast.error('Payment failed');
            }
          } catch (error) {
            setPaymentStatus('error');
            toast.error('Payment processing failed');
          } finally {
            setIsProcessing(false);
          }
        }, 2000);
      }
    } catch (error) {
      setPaymentStatus('error');
      toast.error('Payment processing failed');
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
            <Label className="text-sm font-medium">Select Payment Method</Label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`p-3 border rounded-xl cursor-pointer transition-all ${
                    selectedMethod === method.id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  } ${!method.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => method.enabled && setSelectedMethod(method.id)}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{method.icon}</div>
                    <div className="font-medium text-sm">{method.name}</div>
                    <div className="text-xs text-muted-foreground">{method.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Form Fields */}
          {selectedMethod === 'upi' && (
            <div className="space-y-3 mb-6">
              <Label htmlFor="upi-id">UPI ID</Label>
              <Input
                id="upi-id"
                placeholder="yourname@paytm"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
            </div>
          )}

          {selectedMethod === 'card' && (
            <div className="space-y-3 mb-6">
              <div>
                <Label htmlFor="card-number">Card Number</Label>
                <Input
                  id="card-number"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-6">
            <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-medium">Secure Payment</p>
              <p className="text-blue-400/80">Your payment information is encrypted and secure. This is a demo payment system.</p>
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
              disabled={!selectedMethod || isProcessing}
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

          {/* Demo Notice */}
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <p className="text-xs text-yellow-300 text-center">
              <strong>Demo Mode:</strong> This simulates payment processing. In production, integrate with actual payment gateway.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SimplePaymentModal;