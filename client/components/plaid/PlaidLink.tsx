import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Link, 
  Banknote, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Building2,
  CreditCard,
  Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PlaidLinkProps {
  onSuccess: (data: any) => void;
  onClose: () => void;
}

const PlaidLink: React.FC<PlaidLinkProps> = ({ onSuccess, onClose }) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);

  useEffect(() => {
    createLinkToken();
  }, []);

  const createLinkToken = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': '507f1f77bcf86cd799439011'
        }
      });

      const data = await response.json();
      setLinkToken(data.link_token);
    } catch (error) {
      console.error('Error creating link token:', error);
      toast.error('Failed to create Plaid link');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaidSuccess = async (publicToken: string) => {
    try {
      setStatus('connecting');
      
      // Exchange public token for access token
      const response = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': '507f1f77bcf86cd799439011'
        },
        body: JSON.stringify({ public_token: publicToken })
      });

      const data = await response.json();
      
      if (data.access_token) {
        // Sync investments from Plaid
        await syncInvestments(data.access_token);
        setStatus('success');
        toast.success('Bank account connected successfully!');
        onSuccess(data);
      }
    } catch (error) {
      console.error('Error exchanging token:', error);
      setStatus('error');
      toast.error('Failed to connect bank account');
    }
  };

  const syncInvestments = async (accessToken: string) => {
    try {
      const response = await fetch('/api/plaid/sync-investments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': '507f1f77bcf86cd799439011'
        },
        body: JSON.stringify({ access_token: accessToken })
      });

      const data = await response.json();
      console.log('Synced investments:', data);
    } catch (error) {
      console.error('Error syncing investments:', error);
    }
  };

  const openPlaidLink = () => {
    if (!linkToken) {
      toast.error('Link token not available');
      return;
    }

    // In a real implementation, you would use Plaid Link
    // For demo purposes, we'll simulate the connection
    setStatus('connecting');
    
    setTimeout(() => {
      // Simulate successful connection
      handlePlaidSuccess('demo_public_token');
    }, 2000);
  };

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
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-400" />
              Connect Bank Account
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-white"
            >
              ×
            </Button>
          </div>

          {/* Plaid Benefits */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <TrendingUp className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-300">Automatic Investment Tracking</h3>
                <p className="text-sm text-blue-200">Sync your existing investments from your bank accounts</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <Banknote className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-300">Real-time Balance Updates</h3>
                <p className="text-sm text-green-200">Get live updates on your account balances and transactions</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <CreditCard className="w-5 h-5 text-purple-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-purple-300">Secure & Encrypted</h3>
                <p className="text-sm text-purple-200">Bank-level security with 256-bit encryption</p>
              </div>
            </div>
          </div>

          {/* Status Display */}
          <AnimatePresence>
            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl mb-4"
              >
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-medium">Bank account connected successfully!</span>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4"
              >
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-medium">Failed to connect bank account</span>
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
              disabled={status === 'connecting'}
            >
              Cancel
            </Button>
            <Button
              onClick={openPlaidLink}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={!linkToken || status === 'connecting'}
            >
              {status === 'connecting' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link className="w-4 h-4 mr-2" />
                  Connect Bank
                </>
              )}
            </Button>
          </div>

          {/* Demo Notice */}
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <p className="text-xs text-yellow-300 text-center">
              <strong>Demo Mode:</strong> This is a simulation. In production, this would open Plaid Link for real bank connections.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PlaidLink;