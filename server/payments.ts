import { Request, Response } from "express";
import { Investment as InvestmentModel } from "../models/Investment";
import type { IInvestment } from "../models/Investment";
import mongoose from "mongoose";

// Ensure consistent model typing for mongoose operations
const Investment: mongoose.Model<IInvestment> = InvestmentModel as unknown as mongoose.Model<IInvestment>;

// Simple payment simulation (for demo purposes)
export const createPaymentOrder = async (req: Request, res: Response) => {
  try {
    const { amount, currency = "INR", symbol, name, quantity, type, sector } = req.body;
    const userId = req.headers['user-id'] || '507f1f77bcf86cd799439011';

    // Validate required fields
    if (!amount || !symbol || !name || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate a mock order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.json({
      orderId,
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency,
      status: 'created',
      payment_url: `https://payment-demo.financeflow.com/pay/${orderId}`,
      message: 'Payment order created. In production, integrate with actual payment gateway.'
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
};

// Simulate payment success (for demo)
export const simulatePaymentSuccess = async (req: Request, res: Response) => {
  try {
    const { orderId, symbol, name, quantity, type, sector, amount } = req.body;
    const userId = req.headers['user-id'] || '507f1f77bcf86cd799439011';

    if (!orderId || !symbol || !name || !quantity || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const avgPrice = amount / parseInt(quantity);
    const totalInvested = amount;
    const currentValue = amount; // For demo, current value = invested amount
    const gainLoss = 0;
    const gainLossPercent = 0;

    // Create investment record
    const investment = new Investment({
      userId: new mongoose.Types.ObjectId(userId as string),
      symbol: symbol.toUpperCase(),
      name,
      type: type || 'stock',
      quantity: parseInt(quantity),
      avgPrice,
      currentPrice: avgPrice,
      totalInvested,
      currentValue,
      gainLoss,
      gainLossPercent,
      sector: sector || 'Others',
      purchaseDate: new Date(),
      lastUpdated: new Date(),
      paymentIntentId: orderId,
      status: 'active',
      source: 'manual'
    });

    await investment.save();

    res.json({
      success: true,
      investment,
      message: 'Investment created successfully (Demo Payment)'
    });
  } catch (error) {
    console.error('Error simulating payment:', error);
    res.status(500).json({ error: 'Failed to simulate payment' });
  }
};

// Get payment history for user
export const getPaymentHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] || '507f1f77bcf86cd799439011';

    const investments = await Investment.find({ 
      userId: new mongoose.Types.ObjectId(userId as string),
      paymentIntentId: { $exists: true }
    }).sort({ purchaseDate: -1 });

    res.json({ investments });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
};

// Get payment methods (for demo)
export const getPaymentMethods = async (req: Request, res: Response) => {
  try {
    const paymentMethods = [
      {
        id: 'upi',
        name: 'UPI',
        description: 'Pay using UPI (Google Pay, PhonePe, Paytm)',
        icon: '📱',
        enabled: true
      },
      {
        id: 'card',
        name: 'Credit/Debit Card',
        description: 'Pay using Visa, Mastercard, RuPay',
        icon: '💳',
        enabled: true
      },
      {
        id: 'netbanking',
        name: 'Net Banking',
        description: 'Pay using your bank account',
        icon: '🏦',
        enabled: true
      },
      {
        id: 'wallet',
        name: 'Digital Wallet',
        description: 'Pay using Paytm, Mobikwik, etc.',
        icon: '💰',
        enabled: true
      },
      {
        id: 'emi',
        name: 'EMI',
        description: 'Pay in installments',
        icon: '📊',
        enabled: false
      }
    ];

    res.json({ paymentMethods });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
};