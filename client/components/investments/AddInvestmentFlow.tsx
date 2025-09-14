import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  TrendingUp, 
  CreditCard, 
  CheckCircle, 
  ArrowLeft,
  ArrowRight,
  Building2,
  Calculator,
  Shield,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import SimplePaymentModal from "@/components/payments/SimplePaymentModal";

interface AddInvestmentFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (investment: any) => void;
}

interface StockSearchResult {
  symbol: string;
  name: string;
  sector: string;
  exchange: string;
}

const AddInvestmentFlow: React.FC<AddInvestmentFlowProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [investmentType, setInvestmentType] = useState('stock');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSearching, setIsSearching] = useState(false);

  const totalSteps = 3;
  const minInvestment = 100;
  const maxInvestment = 1000000;

  const totalAmount = selectedStock ? quantity * selectedStock.price : 0;

  useEffect(() => {
    if (searchQuery.length > 2) {
      const timeoutId = setTimeout(() => {
        searchStocks();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (currentStep === 3) {
      fetchPaymentMethods();
    }
  }, [currentStep]);

  const searchStocks = async () => {
    try {
      setIsSearching(true);
      
      // Mock search results for demo
      const mockResults = [
        { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Oil & Gas', exchange: 'NSE' },
        { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', sector: 'IT Services', exchange: 'NSE' },
        { symbol: 'HDFC', name: 'HDFC Bank Ltd', sector: 'Banking', exchange: 'NSE' },
        { symbol: 'INFY', name: 'Infosys Ltd', sector: 'IT Services', exchange: 'NSE' },
        { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', sector: 'FMCG', exchange: 'NSE' },
        { symbol: 'ITC', name: 'ITC Ltd', sector: 'FMCG', exchange: 'NSE' },
        { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', exchange: 'NSE' },
        { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', sector: 'Telecom', exchange: 'NSE' }
      ].filter(stock => 
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setSearchResults(mockResults);
      
      // Try real API as fallback
      try {
        const response = await fetch(`/api/stocks/search?query=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            setSearchResults(data);
          }
        }
      } catch (apiError) {
        // Use mock results if API fails
        console.log('Using mock search results');
      }
    } catch (error) {
      console.error('Error searching stocks:', error);
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payments/methods');
      const data = await response.json();
      setPaymentMethods(data.paymentMethods || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      // Fallback to mock payment methods
      setPaymentMethods([
        { id: 'upi', name: 'UPI', description: 'Pay using UPI (Google Pay, PhonePe, Paytm)', icon: '📱', enabled: true },
        { id: 'card', name: 'Credit/Debit Card', description: 'Pay using Visa, Mastercard, RuPay', icon: '💳', enabled: true },
        { id: 'netbanking', name: 'Net Banking', description: 'Pay using your bank account', icon: '🏦', enabled: true },
        { id: 'wallet', name: 'Digital Wallet', description: 'Pay using Paytm, Mobikwik, etc.', icon: '💰', enabled: true }
      ]);
    }
  };

  const handleStockSelect = (stock: any) => {
    setSelectedStock({
      ...stock,
      price: Math.random() * 1000 + 100, // Mock price for demo
      change: (Math.random() - 0.5) * 10 // Mock change for demo
    });
    // Don't automatically advance to step 2, let user click Next
  };

  const validateStep2 = () => {
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

  const handleNext = () => {
    if (currentStep === 1 && selectedStock) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handlePayment = () => {
    if (validateStep2() && selectedPaymentMethod) {
      setShowPaymentModal(true);
    } else if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
    }
  };

  const handlePaymentSuccess = (investment: any) => {
    onSuccess(investment);
    setShowPaymentModal(false);
    onClose();
    resetFlow();
  };

  const resetFlow = () => {
    setCurrentStep(1);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedStock(null);
    setQuantity(1);
    setInvestmentType('stock');
    setSelectedPaymentMethod('');
    setPaymentMethods([]);
    setErrors({});
  };

  const steps = [
    { number: 1, title: 'Search Stock', description: 'Find the stock you want to invest in' },
    { number: 2, title: 'Investment Details', description: 'Enter quantity and investment type' },
    { number: 3, title: 'Payment', description: 'Complete your investment' }
  ];

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
          className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Add New Investment</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-white"
            >
              ×
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep >= step.number 
                    ? 'bg-purple-primary border-purple-primary text-white' 
                    : 'border-gray-600 text-gray-400'
                }`}>
                  {currentStep > step.number ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.number}</span>
                  )}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-purple-primary' : 'bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Stock Search */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold mb-4">Search for a Stock</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by symbol or company name..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin" />
                  )}
                </div>
              </div>

              {/* Search Results */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((stock) => (
                  <div
                    key={stock.symbol}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                      selectedStock?.symbol === stock.symbol
                        ? 'bg-purple-500/20 border border-purple-500/30'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                    onClick={() => handleStockSelect(stock)}
                  >
                    <div>
                      <div className="font-semibold">{stock.symbol}</div>
                      <div className="text-sm text-muted-foreground">{stock.name}</div>
                      <div className="text-xs text-muted-foreground">{stock.sector} • {stock.exchange}</div>
                    </div>
                    {selectedStock?.symbol === stock.symbol ? (
                      <CheckCircle className="w-4 h-4 text-purple-400" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>

              {/* Selected Stock Preview */}
              {selectedStock && (
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <h4 className="font-semibold text-purple-300 mb-2">Selected Stock</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{selectedStock.symbol}</div>
                      <div className="text-sm text-muted-foreground">{selectedStock.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">₹{selectedStock.price.toLocaleString()}</div>
                      <div className={`text-sm ${selectedStock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Investment Details */}
          {currentStep === 2 && selectedStock && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold mb-4">Investment Details</h3>
                
                {/* Selected Stock Info */}
                <div className="p-4 rounded-xl bg-white/5 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-lg">{selectedStock.symbol}</h4>
                      <p className="text-muted-foreground">{selectedStock.name}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">₹{selectedStock.price.toLocaleString()}</div>
                      <div className={`text-sm ${selectedStock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Investment Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Number of Shares</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="mt-1"
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
                <div className="p-4 rounded-xl bg-white/5">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
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
                      <span className="font-medium">₹{selectedStock.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-white/10 pt-2">
                      <span>Total Investment:</span>
                      <span className="text-purple-accent">₹{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {errors.amount && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mt-3">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <p className="text-red-400 text-sm">{errors.amount}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Payment */}
          {currentStep === 3 && selectedStock && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold mb-4">Complete Investment</h3>
                
                {/* Investment Summary */}
                <div className="p-4 rounded-xl bg-white/5 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-lg">{selectedStock.symbol}</h4>
                      <p className="text-muted-foreground">{selectedStock.name}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">₹{selectedStock.price.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{quantity} shares</div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xl font-bold border-t border-white/10 pt-2 mt-2">
                    <span>Total Amount:</span>
                    <span className="text-purple-accent">₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Payment Methods Selection */}
                <div className="space-y-4 mb-6">
                  <Label className="text-sm font-medium">Select Payment Method</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`p-3 border rounded-xl cursor-pointer transition-all ${
                          selectedPaymentMethod === method.id
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        } ${!method.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => method.enabled && setSelectedPaymentMethod(method.id)}
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

                {/* Security Notice */}
                <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-6">
                  <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div className="text-sm text-blue-300">
                    <p className="font-medium">Secure Payment</p>
                    <p className="text-blue-400/80">Your payment is processed securely. This is a demo payment system.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : onClose()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {currentStep > 1 ? 'Back' : 'Cancel'}
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !selectedStock) ||
                  (currentStep === 2 && Object.keys(errors).length > 0)
                }
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handlePayment}
                disabled={Object.keys(errors).length > 0 || totalAmount < minInvestment || !selectedPaymentMethod}
                className="flex items-center gap-2 bg-purple-primary hover:bg-purple-primary/90"
              >
                <CreditCard className="w-4 h-4" />
                Pay ₹{totalAmount.toLocaleString()}
              </Button>
            )}
          </div>

          {/* Payment Modal */}
          <SimplePaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            investmentData={{
              symbol: selectedStock?.symbol || '',
              name: selectedStock?.name || '',
              quantity: quantity,
              price: selectedStock?.price || 0,
              total: totalAmount,
              type: investmentType,
              sector: selectedStock?.sector || 'Others'
            }}
            onSuccess={handlePaymentSuccess}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddInvestmentFlow;