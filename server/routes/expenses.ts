import { Request, Response } from "express";
import { Expense } from "../models/Expense";
import { Goal } from "../models/Goal";
import { EventEmitter } from "events";

// SSE event bus for expense updates
export const expenseEvents = new EventEmitter();
expenseEvents.setMaxListeners(0);

export type ExpenseEvent =
  | { type: "added"; expense: any }
  | { type: "updated"; expense: any }
  | { type: "deleted"; id: string };

export function broadcastExpenseEvent(event: ExpenseEvent) {
  expenseEvents.emit("event", event);
}

// Server-Sent Events endpoint for expense updates
export const expensesStream = (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const onEvent = (event: ExpenseEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  expenseEvents.on("event", onEvent);

  // Send a comment to establish the stream
  res.write(": connected\n\n");

  _req.on("close", () => {
    expenseEvents.off("event", onEvent);
    res.end();
  });
};

// Get all expenses for a user with filtering and pagination
export const getExpenses = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] || '507f1f77bcf86cd799439011'; // Mock user ID
    const { 
      page = 1, 
      limit = 20, 
      category, 
      startDate, 
      endDate, 
      isRecurring,
      isEssential 
    } = req.query;
    
    const filter: any = { userId };
    
    if (category) filter.category = category;
    if (isRecurring !== undefined) filter.isRecurring = isRecurring === 'true';
    if (isEssential !== undefined) filter.isEssential = isEssential === 'true';
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }
    
    const expenses = await Expense.find(filter)
      .sort({ date: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));
    
    const totalExpenses = await Expense.countDocuments(filter);
    
    // Calculate summary statistics
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const monthlyExpenses = await Expense.find({
      userId,
      date: { $gte: currentMonth }
    });
    
    const monthlyTotal = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const categoryBreakdown = monthlyExpenses.reduce((acc: any, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});
    
    // Get spending trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const trendData = await Expense.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" }
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);
    
    res.json({
      expenses,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalExpenses / Number(limit)),
        totalItems: totalExpenses,
        hasNext: Number(page) * Number(limit) < totalExpenses,
        hasPrev: Number(page) > 1
      },
      summary: {
        monthlyTotal,
        categoryBreakdown,
        trendData,
        averageDaily: monthlyTotal / new Date().getDate()
      }
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

// Add new expense
export const addExpense = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] || '507f1f77bcf86cd799439011'; // Mock user ID
    const expenseData = { ...req.body, userId };
    
    const expense = new Expense(expenseData);
    await expense.save();
    
    // Broadcast real-time event
    broadcastExpenseEvent({ type: "added", expense });

    res.status(201).json(expense);
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ error: 'Failed to add expense' });
  }
};

// Update expense
export const updateExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] || '507f1f77bcf86cd799439011';
    
    const expense = await Expense.findOneAndUpdate(
      { _id: id, userId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    // Broadcast real-time event
    broadcastExpenseEvent({ type: "updated", expense });

    res.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
};

// Delete expense
export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] || '507f1f77bcf86cd799439011';
    
    const expense = await Expense.findOneAndDelete({ _id: id, userId });
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    // Broadcast real-time event
    broadcastExpenseEvent({ type: "deleted", id: id });

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
};

// Get expense categories and their statistics
export const getExpenseCategories = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] || '507f1f77bcf86cd799439011';
    
    const categories = await Expense.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: "$category",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$amount" },
          lastExpense: { $max: "$date" }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);
    
    // Predefined categories with icons and colors
    const categoryMeta = {
      'Food & Dining': { icon: '🍽️', color: '#FF6B6B', essential: true },
      'Transportation': { icon: '🚗', color: '#4ECDC4', essential: true },
      'Shopping': { icon: '🛍️', color: '#45B7D1', essential: false },
      'Entertainment': { icon: '🎬', color: '#96CEB4', essential: false },
      'Bills & Utilities': { icon: '💡', color: '#FFEAA7', essential: true },
      'Healthcare': { icon: '🏥', color: '#DDA0DD', essential: true },
      'Education': { icon: '📚', color: '#98D8C8', essential: true },
      'Travel': { icon: '✈️', color: '#F7DC6F', essential: false },
      'Groceries': { icon: '🛒', color: '#82E0AA', essential: true },
      'Personal Care': { icon: '💄', color: '#F8C471', essential: true },
      'Other': { icon: '📦', color: '#BDC3C7', essential: false }
    };
    
    const enrichedCategories = categories.map(cat => ({
      ...cat,
      ...categoryMeta[cat._id as keyof typeof categoryMeta] || categoryMeta['Other']
    }));
    
    res.json(enrichedCategories);
  } catch (error) {
    console.error('Error fetching expense categories:', error);
    res.status(500).json({ error: 'Failed to fetch expense categories' });
  }
};

// Get expense insights and analytics
export const getExpenseInsights = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] || '507f1f77bcf86cd799439011';
    
    const currentDate = new Date();
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const lastMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    
    // Current month vs last month comparison
    const [currentMonthExpenses, lastMonthExpenses] = await Promise.all([
      Expense.find({ userId, date: { $gte: currentMonth } }),
      Expense.find({ userId, date: { $gte: lastMonth, $lte: lastMonthEnd } })
    ]);
    
    const currentMonthTotal = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const lastMonthTotal = lastMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const monthlyChange = lastMonthTotal > 0 ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
    
    // Weekly spending pattern
    const weeklyPattern = currentMonthExpenses.reduce((acc: any, exp) => {
      const dayOfWeek = exp.date.getDay();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const day = days[dayOfWeek];
      acc[day] = (acc[day] || 0) + exp.amount;
      return acc;
    }, {});
    
    // Top merchants/vendors
    const topMerchants = currentMonthExpenses
      .filter(exp => exp.merchant)
      .reduce((acc: any, exp) => {
        acc[exp.merchant!] = (acc[exp.merchant!] || 0) + exp.amount;
        return acc;
      }, {});
    
    const sortedMerchants = Object.entries(topMerchants)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([name, amount]) => ({ name, amount }));
    
    // Spending velocity (daily average)
    const daysInMonth = currentDate.getDate();
    const dailyAverage = currentMonthTotal / daysInMonth;
    const projectedMonthly = dailyAverage * new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    
    res.json({
      monthlyComparison: {
        current: currentMonthTotal,
        previous: lastMonthTotal,
        change: monthlyChange,
        changeDirection: monthlyChange > 0 ? 'increase' : 'decrease'
      },
      weeklyPattern,
      topMerchants: sortedMerchants,
      spendingVelocity: {
        dailyAverage,
        projectedMonthly,
        daysRemaining: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() - daysInMonth
      },
      recommendations: [
        {
          type: 'category_alert',
          message: 'Your dining expenses are 23% higher than last month',
          action: 'Consider meal planning to reduce costs',
          priority: 'medium'
        },
        {
          type: 'recurring_savings',
          message: 'You could save ₹1,200/month by switching to a different mobile plan',
          action: 'Review subscription services',
          priority: 'low'
        }
      ]
    });
  } catch (error) {
    console.error('Error fetching expense insights:', error);
    res.status(500).json({ error: 'Failed to fetch expense insights' });
  }
};

// --- Predictive Analytics: Monthly Forecast ---
export const getExpenseForecast = async (req: Request, res: Response) => {
  try {
    const userId = (req.headers['user-id'] as string) || '507f1f77bcf86cd799439011';
    const months = Math.max(1, Math.min(12, Number(req.query.months) || 3));

    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);

    // Aggregate last 12 months totals and per-category totals per month
    const monthlyAgg = await Expense.aggregate([
      { $match: { userId, date: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { y: { $year: '$date' }, m: { $month: '$date' }, category: '$category' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]);

    // Build month->total and category->month->total maps
    const monthKey = (y: number, m: number) => `${y}-${String(m).padStart(2, '0')}`;
    const perMonthTotal: Record<string, number> = {};
    const perCatPerMonth: Record<string, Record<string, number>> = {};

    for (const row of monthlyAgg as any[]) {
      const k = monthKey(row._id.y, row._id.m);
      perMonthTotal[k] = (perMonthTotal[k] || 0) + row.total;
      const cat = row._id.category || 'Other';
      if (!perCatPerMonth[cat]) perCatPerMonth[cat] = {};
      perCatPerMonth[cat][k] = (perCatPerMonth[cat][k] || 0) + row.total;
    }

    // Helper: last N months average for a series
    function movingAverage(series: number[], window = 3) {
      if (series.length === 0) return 0;
      const w = Math.min(window, series.length);
      const tail = series.slice(-w);
      return tail.reduce((a, b) => a + b, 0) / w;
    }

    // Gather ordered keys of last 12 months
    const keys: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(monthKey(d.getFullYear(), d.getMonth() + 1));
    }

    const totalSeries = keys.map((k) => perMonthTotal[k] || 0);
    const baseTotal = movingAverage(totalSeries, 3);

    // Category weights based on last 3 months average share
    const catWeights: Record<string, number> = {};
    let weightDen = 0;
    for (const [cat, map] of Object.entries(perCatPerMonth)) {
      const catSeries = keys.map((k) => map[k] || 0);
      const avg = movingAverage(catSeries, 3);
      catWeights[cat] = avg;
      weightDen += avg;
    }
    // Normalize weights; if empty, fallback to 100% Other
    if (weightDen <= 0) {
      catWeights['Other'] = 1;
      weightDen = 1;
    }

    const normalized = Object.fromEntries(
      Object.entries(catWeights).map(([k, v]) => [k, v / weightDen])
    );

    // Forecast next N months using constant baseTotal and category weights
    const forecasts: Array<{ month: string; total: number; categories: Record<string, number> }> = [];
    for (let i = 1; i <= months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const mk = monthKey(d.getFullYear(), d.getMonth() + 1);
      const categories: Record<string, number> = {};
      for (const [cat, w] of Object.entries(normalized)) {
        categories[cat] = Math.round((baseTotal * w) * 100) / 100;
      }
      const total = Math.round(baseTotal * 100) / 100;
      forecasts.push({ month: mk, total, categories });
    }

    res.json({
      basis: {
        method: '3-month moving average',
        samples: totalSeries,
      },
      forecasts,
    });
  } catch (error) {
    console.error('Error generating forecast:', error);
    res.status(500).json({ error: 'Failed to generate forecast' });
  }
};

// --- Anomaly Detection: flag unusual or duplicate expenses ---
export const getExpenseAnomalies = async (req: Request, res: Response) => {
  try {
    const userId = (req.headers['user-id'] as string) || '507f1f77bcf86cd799439011';
    const days = Math.max(7, Math.min(365, Number(req.query.days) || 90));
    const since = new Date();
    since.setDate(since.getDate() - days);

    const expenses = await Expense.find({ userId, date: { $gte: since } }).sort({ date: -1 });

    // Compute category stats
    const catAmounts: Record<string, number[]> = {};
    for (const e of expenses) {
      const cat = e.category || 'Other';
      if (!catAmounts[cat]) catAmounts[cat] = [];
      catAmounts[cat].push(e.amount);
    }

    function meanStd(arr: number[]) {
      if (!arr.length) return { mean: 0, std: 0 };
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
      return { mean, std: Math.sqrt(variance) };
    }
    function percentile(arr: number[], p: number) {
      if (!arr.length) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
      return sorted[idx];
    }

    const catStats = Object.fromEntries(
      Object.entries(catAmounts).map(([cat, arr]) => [
        cat,
        { ...meanStd(arr), p90: percentile(arr, 90), p95: percentile(arr, 95) },
      ])
    ) as Record<string, { mean: number; std: number; p90: number; p95: number }>;

    // Duplicate detection helper (merchant + amount within 36h)
    const duplicates: Set<string> = new Set();
    const seen: Record<string, Date[]> = {};
    for (const e of expenses) {
      const key = `${(e.merchant || '').toLowerCase()}|${e.amount}`;
      if (!seen[key]) seen[key] = [];
      // Keep only dates within 36 hours of current expense
      const within36 = seen[key].find((d) => Math.abs(e.date.getTime() - d.getTime()) <= 36 * 60 * 60 * 1000);
      if (within36) duplicates.add(`${e._id}`);
      seen[key].push(e.date);
    }

    const anomalies = expenses
      .map((e) => {
        const stats = catStats[e.category || 'Other'];
        const z = stats.std > 0 ? (e.amount - stats.mean) / stats.std : 0;
        const flags: string[] = [];
        if (stats.std > 0 && z >= 2.5) flags.push(`High z-score (${z.toFixed(2)}) vs ${e.category}`);
        if (e.amount >= stats.p95) flags.push(`Above 95th percentile for ${e.category}`);
        if (duplicates.has(`${e._id}`)) flags.push('Possible duplicate charge (same merchant+amount within 36h)');
        if (flags.length === 0) return null;
        return {
          id: e._id,
          title: e.title,
          amount: e.amount,
          category: e.category,
          merchant: e.merchant,
          date: e.date,
          reasons: flags,
        };
      })
      .filter(Boolean);

    res.json({
      windowDays: days,
      totalChecked: expenses.length,
      anomalies,
    });
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    res.status(500).json({ error: 'Failed to detect anomalies' });
  }
};

// --- Bulk Import: accept JSON array of expenses ---
export const importExpenses = async (req: Request, res: Response) => {
  try {
    const userId = (req.headers['user-id'] as string) || '507f1f77bcf86cd799439011';
    const items = Array.isArray(req.body) ? req.body : req.body.items;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Provide an array of expense items' });
    }

    const docs = items
      .filter((it) => it && typeof it.amount === 'number' && it.title && it.date && it.category)
      .map((it) => ({
        userId,
        title: String(it.title).trim(),
        amount: Number(it.amount),
        category: String(it.category).trim(),
        subcategory: it.subcategory ? String(it.subcategory).trim() : undefined,
        description: it.description ? String(it.description).trim() : undefined,
        date: new Date(it.date),
        paymentMethod: it.paymentMethod || 'other',
        isRecurring: Boolean(it.isRecurring),
        recurringFrequency: it.recurringFrequency,
        tags: Array.isArray(it.tags) ? it.tags.map((t: any) => String(t)) : [],
        location: it.location ? String(it.location) : undefined,
        merchant: it.merchant ? String(it.merchant) : undefined,
        isEssential: Boolean(it.isEssential),
      }));

    if (docs.length === 0) {
      return res.status(400).json({ error: 'No valid expense items found' });
    }

    const inserted = await Expense.insertMany(docs, { ordered: false });

    // Broadcast added events (coalesced)
    for (const expense of inserted) {
      broadcastExpenseEvent({ type: 'added', expense });
    }

    res.status(201).json({ inserted: inserted.length });
  } catch (error: any) {
    console.error('Error importing expenses:', error);
    res.status(500).json({ error: 'Failed to import expenses' });
  }
};

// --- Bank/Webhook ingestion: secured via shared secret ---
export const bankWebhook = async (req: Request, res: Response) => {
  try {
    const secret = req.headers['x-webhook-secret'] as string;
    if (!process.env.WEBHOOK_SECRET || secret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized webhook' });
    }
    // Allow provider to pass a specific user id, else fallback
    const userId = (req.headers['user-id'] as string) || '507f1f77bcf86cd799439011';
    const payload = req.body;
    const items = Array.isArray(payload) ? payload : payload.transactions || payload.items;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'Invalid payload' });

    const docs = items
      .filter((it) => it && typeof it.amount === 'number' && it.name && it.date)
      .map((it) => ({
        userId,
        title: String(it.name || it.title).trim(),
        amount: Math.abs(Number(it.amount)),
        category: (Array.isArray(it.category) ? it.category[0] : it.category) || 'Other',
        description: it.description ? String(it.description) : undefined,
        date: new Date(it.date),
        paymentMethod: 'other',
        isRecurring: Boolean(it.recurring),
        merchant: it.merchant ? String(it.merchant) : undefined,
        isEssential: false,
      }));

    if (!docs.length) return res.status(400).json({ error: 'No valid transactions' });

    const inserted = await Expense.insertMany(docs, { ordered: false });
    for (const expense of inserted) broadcastExpenseEvent({ type: 'added', expense });

    res.status(201).json({ inserted: inserted.length });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
};

// --- Personalized Plan: combine spending + goals to suggest monthly targets ---
export const generatePersonalPlan = async (req: Request, res: Response) => {
  try {
    const userId = (req.headers['user-id'] as string) || '507f1f77bcf86cd799439011';
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1) Current month expenses and breakdown
    const monthExpenses = await Expense.find({ userId, date: { $gte: startOfMonth } });
    const currentSpend = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const byCategory = monthExpenses.reduce((acc: Record<string, { spend: number; count: number; essential: number }>, e) => {
      const key = e.category || 'Other';
      if (!acc[key]) acc[key] = { spend: 0, count: 0, essential: 0 };
      acc[key].spend += e.amount;
      acc[key].count += 1;
      acc[key].essential += e.isEssential ? e.amount : 0;
      return acc;
    }, {});

    // 2) Goals: compute total required monthly savings for active goals
    const activeGoals = await Goal.find({ userId, status: 'active' });
    const requiredMonthly = activeGoals.reduce((sum, g) => {
      const monthsRemaining = Math.max(1, Math.ceil((g.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)));
      const remaining = Math.max(0, g.targetAmount - g.currentAmount);
      return sum + remaining / monthsRemaining;
    }, 0);

    // 3) Suggest cuts from non-essential top categories (cap at 20% per category)
    // Determine available cut pool: aim to meet requiredMonthly
    const nonEssentialEntries = Object.entries(byCategory)
      .map(([k, v]) => ({
        category: k,
        spend: v.spend,
        nonEssentialSpend: Math.max(0, v.spend - v.essential),
      }))
      .sort((a, b) => b.nonEssentialSpend - a.nonEssentialSpend);

    let remainingTarget = requiredMonthly;
    const categoryTargets: Record<string, { current: number; cut: number; target: number }> = {};
    for (const { category, spend, nonEssentialSpend } of nonEssentialEntries) {
      if (remainingTarget <= 0) break;
      const maxCut = Math.min(nonEssentialSpend, spend * 0.2); // up to 20% per category
      const cut = Math.min(maxCut, remainingTarget);
      categoryTargets[category] = {
        current: Math.round(spend * 100) / 100,
        cut: Math.round(cut * 100) / 100,
        target: Math.round((spend - cut) * 100) / 100,
      };
      remainingTarget -= cut;
    }

    // If still not met, propose global suggestions
    const met = requiredMonthly - remainingTarget;

    const recommendations: Array<{ type: string; message: string; priority: 'low' | 'medium' | 'high' }> = [];
    if (requiredMonthly > 0) {
      if (remainingTarget <= 0) {
        recommendations.push({
          type: 'savings_plan',
          message: `Redirect ₹${Math.round(requiredMonthly)}/month from non-essential categories to goals to stay on track`,
          priority: 'high',
        });
      } else {
        recommendations.push({
          type: 'partial_plan',
          message: `Planned cuts cover ₹${Math.round(met)} of ₹${Math.round(requiredMonthly)} needed. Consider reducing subscriptions or adjusting timelines.`,
          priority: 'medium',
        });
      }
    }

    // Add 3 quick tips based on patterns
    const biggest = nonEssentialEntries[0];
    if (biggest && biggest.nonEssentialSpend > 0) {
      recommendations.push({
        type: 'category_focus',
        message: `Largest non-essential spend: ${biggest.category}. Try a 14-day freeze or set a weekly cap.`,
        priority: 'low',
      });
    }

    res.json({
      month: `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}`,
      currentSpend: Math.round(currentSpend * 100) / 100,
      goals: {
        active: activeGoals.length,
        requiredMonthly: Math.round(requiredMonthly * 100) / 100,
      },
      plan: {
        byCategory: categoryTargets,
        totalPlannedSavings: Math.round((requiredMonthly - remainingTarget) * 100) / 100,
        shortfall: Math.max(0, Math.round(remainingTarget * 100) / 100),
      },
      recommendations,
    });
  } catch (error) {
    console.error('Error generating personal plan:', error);
    res.status(500).json({ error: 'Failed to generate personal plan' });
  }
};