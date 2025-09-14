import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { coachHandler } from "./routes/ai";
import { connectMongo } from "./db";
import { signupHandler, loginHandler } from "./routes/auth";
import { getInvestments, addInvestment, updateInvestment, deleteInvestment, updatePrices, getMarketData, searchStocks, getQuotes } from "./routes/investments";
import { getExpenses, addExpense, updateExpense, deleteExpense, getExpenseCategories, getExpenseInsights, expensesStream } from "./routes/expenses";
import { getGoals, addGoal, updateGoal, addContribution, deleteGoal, getGoalInsights } from "./routes/goals";
import { createPaymentOrder, simulatePaymentSuccess, getPaymentHistory, getPaymentMethods } from "./routes/payments";
import { createLinkToken, exchangeToken, getInvestmentAccounts, getTransactions, syncInvestmentsFromPlaid, getAccountBalance } from "./routes/plaid";
import { seedData } from "./routes/seed";

export function createServer() {
  const app = express();

  // DB
  void connectMongo();

  // Middleware
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || true,
      credentials: true,
    }),
  );
  // Parse JSON regardless of content-type to be resilient behind proxies (e.g., Netlify)
  app.use(express.json({ type: "*/*" }));
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.post("/api/ai/coach", coachHandler);

  // Auth
  app.post("/api/auth/signup", signupHandler);
  app.post("/api/auth/login", loginHandler);

  // Investments
  app.get("/api/investments", getInvestments);
  app.post("/api/investments", addInvestment);
  app.put("/api/investments/:id", updateInvestment);
  app.delete("/api/investments/:id", deleteInvestment);
  app.post("/api/investments/update-prices", updatePrices);
  app.get("/api/market", getMarketData);
  app.get("/api/stocks/search", searchStocks);
  app.get("/api/quotes", getQuotes);

  // Expenses
  app.get("/api/expenses", getExpenses);
  app.post("/api/expenses", addExpense);
  app.put("/api/expenses/:id", updateExpense);
  app.delete("/api/expenses/:id", deleteExpense);
  app.get("/api/expenses/categories", getExpenseCategories);
  app.get("/api/expenses/insights", getExpenseInsights);
  // Real-time expense updates via SSE
  app.get("/api/expenses/stream", expensesStream);

  // Goals
  app.get("/api/goals", getGoals);
  app.post("/api/goals", addGoal);
  app.put("/api/goals/:id", updateGoal);
  app.post("/api/goals/:id/contribute", addContribution);
  app.delete("/api/goals/:id", deleteGoal);
  app.get("/api/goals/insights", getGoalInsights);

  // Payment routes
  app.post("/api/payments/create-order", createPaymentOrder);
  app.post("/api/payments/simulate-success", simulatePaymentSuccess);
  app.get("/api/payments/history", getPaymentHistory);
  app.get("/api/payments/methods", getPaymentMethods);

  // Plaid routes
  app.post("/api/plaid/create-link-token", createLinkToken);
  app.post("/api/plaid/exchange-token", exchangeToken);
  app.post("/api/plaid/investment-accounts", getInvestmentAccounts);
  app.post("/api/plaid/transactions", getTransactions);
  app.post("/api/plaid/sync-investments", syncInvestmentsFromPlaid);
  app.post("/api/plaid/account-balance", getAccountBalance);

  // Seed data (for development)
  app.post("/api/seed", seedData);

  return app;
}
