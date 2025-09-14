import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Calculator, 
  CreditCard, 
  Info,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SimplePaymentModal from "@/components/payments/SimplePaymentModal";

interface InvestmentPurchaseProps {
  stockData: {
    symbol: string;
    name: string;
    price: number;
    change: number;
    sector: string;
  };
  onInvestmentComplete: (investment: any) => void;
}

const InvestmentPurchase: React.FC<InvestmentPurchaseProps> = ({ 
  stockData, 
  onInvestmentComplete 
}) => {
  const [quantity, setQuantity] = useState(1);
  const [investmentType, setInvestmentType] = useState('stock');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const totalAmount = quantity * stockData.price;
  const minInvestment = 100; // Minimum ₹100 investment
  const maxInvestment = 1000000; // Maximum ₹10,00,000 investment

  const validateInput = () => {
    const newErrors: {[key: string]: string} = {};

    if (quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    }

    if (totalAmount < minInvestment) {
      newErrors.amount = `Minimum investment is ₹${minInvestment.toLocaleString()}`;
    }

    if (totalAmount > maxInvestment) {
      newErrors.amount = `Maximum investment is ₹${maxInvestment.toLocaleString()}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInvest = () => {
    if (validateInput()) {
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = (investment: any) => {
    onInvestmentComplete(investment);
    setShowPaymentModal(false);
    setQuantity(1);
    setErrors({});
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-primary/20 rounded-xl">
            <TrendingUp className="w-6 h-6 text-purple-accent" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Invest in {stockData.symbol}</h3>
            <p className="text-muted-foreground">{stockData.name}</p>
          </div>
        </div>

        {/* Stock Info */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-xl">
          <div>
            <p className="text-sm text-muted-foreground">Current Price</p>
            <p className="text-lg font-semibold">₹{stockData.price.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Change</p>
            <p className={`text-lg font-semibold ${
              stockData.change >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Investment Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="quantity">Number of Shares</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="mt-1"
              placeholder="Enter quantity"
            />
            {errors.quantity && (
              <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.quantity}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="type">Investment Type</Label>
            <Select value={investmentType} onValueChange={setInvestmentType}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select investment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stock">Stock</SelectItem>
                <SelectItem value="etf">ETF</SelectItem>
                <SelectItem value="mutual_fund">Mutual Fund</SelectItem>
                <SelectItem value="bond">Bond</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Investment Summary */}
        <div className="space-y-3 p-4 bg-white/5 rounded-xl">
          <h4 className="font-semibold flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Investment Summary
          </h4>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shares:</span>
              <span className="font-medium">{quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price per share:</span>
              <span className="font-medium">₹{stockData.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-white/10 pt-2">
              <span>Total Investment:</span>
              <span className="text-purple-accent">₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {errors.amount && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-red-400 text-sm">{errors.amount}</p>
            </div>
          )}
        </div>

        {/* Investment Guidelines */}
        <div className="space-y-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <h4 className="font-semibold text-blue-300 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Investment Guidelines
          </h4>
          <ul className="text-sm text-blue-200 space-y-1">
            <li>• Minimum investment: ₹{minInvestment.toLocaleString()}</li>
            <li>• Maximum investment: ₹{maxInvestment.toLocaleString()}</li>
            <li>• All investments are subject to market risks</li>
            <li>• Payment processing may take 1-2 business days</li>
          </ul>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleInvest}
          className="w-full bg-purple-primary hover:bg-purple-primary/90 text-lg py-6"
          disabled={Object.keys(errors).length > 0 || totalAmount < minInvestment}
        >
          <CreditCard className="w-5 h-5 mr-2" />
          Invest ₹{totalAmount.toLocaleString()}
        </Button>
      </motion.div>

      {/* Payment Modal */}
      <SimplePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        investmentData={{
          symbol: stockData.symbol,
          name: stockData.name,
          quantity: quantity,
          price: stockData.price,
          total: totalAmount,
          type: investmentType,
          sector: stockData.sector
        }}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
};

export default InvestmentPurchase;