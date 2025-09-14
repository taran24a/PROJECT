import { Request, Response } from "express";
import { PlaidApi, PlaidEnvironments, Configuration } from "plaid";
import { Investment as InvestmentModel } from "../models/Investment";
import type { IInvestment } from "../models/Investment";
import mongoose from "mongoose";

// Initialize Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox, // Use sandbox for development
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || 'your_client_id',
      'PLAID-SECRET': process.env.PLAID_SECRET || 'your_secret',
    },
  },
});

const plaidClient = new PlaidApi(configuration);

// Ensure consistent model typing for mongoose operations
const Investment: mongoose.Model<IInvestment> = InvestmentModel as unknown as mongoose.Model<IInvestment>;

// Create link token for Plaid Link
export const createLinkToken = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] || '507f1f77bcf86cd799439011';

    const request = {
      user: {
        client_user_id: userId as string,
      },
      client_name: 'FinanceFlow',
      products: ['transactions', 'investments', 'accounts'],
      country_codes: ['US'], // Plaid primarily supports US, but we'll use it for demo
      language: 'en',
    };

    const response = await plaidClient.linkTokenCreate(request);
    
    res.json({
      link_token: response.data.link_token,
      expiration: response.data.expiration,
    });
  } catch (error) {
    console.error('Error creating link token:', error);
    res.status(500).json({ error: 'Failed to create link token' });
  }
};

// Exchange public token for access token
export const exchangeToken = async (req: Request, res: Response) => {
  try {
    const { public_token } = req.body;
    const userId = req.headers['user-id'] || '507f1f77bcf86cd799439011';

    if (!public_token) {
      return res.status(400).json({ error: 'Public token required' });
    }

    const request = {
      public_token: public_token,
    };

    const response = await plaidClient.itemPublicTokenExchange(request);
    const access_token = response.data.access_token;

    // Store access token (in production, store securely in database)
    // For now, we'll just return it
    res.json({
      access_token,
      item_id: response.data.item_id,
      message: 'Token exchanged successfully'
    });
  } catch (error) {
    console.error('Error exchanging token:', error);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
};

// Get investment accounts
export const getInvestmentAccounts = async (req: Request, res: Response) => {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({ error: 'Access token required' });
    }

    const request = {
      access_token: access_token,
    };

    const response = await plaidClient.investmentsHoldingsGet(request);
    
    res.json({
      accounts: response.data.accounts,
      holdings: response.data.holdings,
      securities: response.data.securities,
    });
  } catch (error) {
    console.error('Error fetching investment accounts:', error);
    res.status(500).json({ error: 'Failed to fetch investment accounts' });
  }
};

// Get transactions
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const { access_token, start_date, end_date } = req.body;

    if (!access_token) {
      return res.status(400).json({ error: 'Access token required' });
    }

    const request = {
      access_token: access_token,
      start_date: start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end_date: end_date || new Date(),
    };

    const response = await plaidClient.transactionsGet(request);
    
    res.json({
      transactions: response.data.transactions,
      accounts: response.data.accounts,
      total_transactions: response.data.total_transactions,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

// Sync investments from Plaid
export const syncInvestmentsFromPlaid = async (req: Request, res: Response) => {
  try {
    const { access_token } = req.body;
    const userId = req.headers['user-id'] || '507f1f77bcf86cd799439011';

    if (!access_token) {
      return res.status(400).json({ error: 'Access token required' });
    }

    // Get investment data from Plaid
    const investmentResponse = await plaidClient.investmentsHoldingsGet({
      access_token: access_token,
    });

    const accounts = investmentResponse.data.accounts;
    const holdings = investmentResponse.data.holdings;
    const securities = investmentResponse.data.securities;

    const syncedInvestments = [];

    // Process each holding and create investment records
    for (const holding of holdings) {
      const account = accounts.find(acc => acc.account_id === holding.account_id);
      const security = securities.find(sec => sec.security_id === holding.security_id);

      if (account && security) {
        // Check if investment already exists
        const existingInvestment = await Investment.findOne({
          userId: new mongoose.Types.ObjectId(userId as string),
          symbol: security.ticker_symbol || security.name,
        });

        if (!existingInvestment) {
          const investment = new Investment({
            userId: new mongoose.Types.ObjectId(userId as string),
            symbol: security.ticker_symbol || security.name,
            name: security.name,
            type: 'stock',
            quantity: holding.quantity,
            avgPrice: holding.institution_price || 0,
            currentPrice: holding.institution_price || 0,
            totalInvested: holding.institution_value || 0,
            currentValue: holding.institution_value || 0,
            gainLoss: 0,
            gainLossPercent: 0,
            sector: security.type || 'Others',
            purchaseDate: new Date(),
            lastUpdated: new Date(),
            status: 'active',
            source: 'plaid'
          });

          await investment.save();
          syncedInvestments.push(investment);
        }
      }
    }

    res.json({
      success: true,
      synced_count: syncedInvestments.length,
      investments: syncedInvestments,
      message: 'Investments synced successfully from Plaid'
    });
  } catch (error) {
    console.error('Error syncing investments:', error);
    res.status(500).json({ error: 'Failed to sync investments' });
  }
};

// Get account balance
export const getAccountBalance = async (req: Request, res: Response) => {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({ error: 'Access token required' });
    }

    const request = {
      access_token: access_token,
    };

    const response = await plaidClient.accountsBalanceGet(request);
    
    res.json({
      accounts: response.data.accounts,
    });
  } catch (error) {
    console.error('Error fetching account balance:', error);
    res.status(500).json({ error: 'Failed to fetch account balance' });
  }
};