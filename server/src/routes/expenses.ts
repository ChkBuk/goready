import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { expenses, expenseSplits, tripMembers, users } from '../db/schema.js';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { authenticate } from '../middleware/auth.js';
import { requireTripAccess } from '../middleware/tripAccess.js';
import { createExpenseSchema, updateExpenseSchema } from '../utils/validators.js';

export const expensesRouter = Router();

expensesRouter.use(authenticate);

// GET /api/trips/:id/expenses
expensesRouter.get(
  '/:id/expenses',
  requireTripAccess('viewer'),
  async (req: Request, res: Response) => {
    try {
      const tripExpenses = await db
        .select()
        .from(expenses)
        .where(eq(expenses.tripId, req.params.id as string))
        .orderBy(desc(expenses.date));

      // Fetch splits for all expenses
      const expenseIds = tripExpenses.map((e) => e.id);
      let allSplits: (typeof expenseSplits.$inferSelect)[] = [];

      if (expenseIds.length > 0) {
        allSplits = await db
          .select()
          .from(expenseSplits)
          .where(inArray(expenseSplits.expenseId, expenseIds));
      }

      const splitMap = new Map<string, typeof allSplits>();
      for (const split of allSplits) {
        const existing = splitMap.get(split.expenseId) || [];
        existing.push(split);
        splitMap.set(split.expenseId, existing);
      }

      const result = tripExpenses.map((expense) => ({
        ...expense,
        splits: splitMap.get(expense.id) || [],
      }));

      res.json({ success: true, data: result });
    } catch (error) {
      console.error('List expenses error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch expenses' });
    }
  }
);

// POST /api/trips/:id/expenses
expensesRouter.post(
  '/:id/expenses',
  requireTripAccess('editor'),
  async (req: Request, res: Response) => {
    try {
      const parsed = createExpenseSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.issues[0].message });
        return;
      }

      const { splits: splitData, ...expenseData } = parsed.data;
      const tripId = req.params.id as string;

      // Create expense
      const [expense] = await db
        .insert(expenses)
        .values({
          ...expenseData,
          amount: String(expenseData.amount),
          tripId,
          paidBy: req.user!.userId,
        })
        .returning();

      // Create splits
      if (splitData && splitData.length > 0) {
        await db.insert(expenseSplits).values(
          splitData.map((s) => ({
            expenseId: expense.id,
            userId: s.userId,
            amount: String(s.amount),
          }))
        );
      } else if (expenseData.splitType === 'equal') {
        // Auto-split equally among all trip members
        const members = await db
          .select({ userId: tripMembers.userId })
          .from(tripMembers)
          .where(eq(tripMembers.tripId, tripId));

        if (members.length > 0) {
          const splitAmount = Number(expenseData.amount) / members.length;
          await db.insert(expenseSplits).values(
            members.map((m) => ({
              expenseId: expense.id,
              userId: m.userId,
              amount: String(splitAmount.toFixed(2)),
            }))
          );
        }
      }

      // Fetch the created expense with splits
      const splits = await db
        .select()
        .from(expenseSplits)
        .where(eq(expenseSplits.expenseId, expense.id));

      res.status(201).json({ success: true, data: { ...expense, splits } });
    } catch (error) {
      console.error('Create expense error:', error);
      res.status(500).json({ success: false, error: 'Failed to create expense' });
    }
  }
);

// PUT /api/trips/:id/expenses/:expenseId
expensesRouter.put(
  '/:id/expenses/:expenseId',
  requireTripAccess('editor'),
  async (req: Request, res: Response) => {
    try {
      const parsed = updateExpenseSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.issues[0].message });
        return;
      }

      const { splits: splitData, ...expenseData } = parsed.data;
      const updateData: Record<string, unknown> = { ...expenseData };
      if (expenseData.amount !== undefined) {
        updateData.amount = String(expenseData.amount);
      }

      const [expense] = await db
        .update(expenses)
        .set(updateData)
        .where(eq(expenses.id, req.params.expenseId as string))
        .returning();

      if (!expense) {
        res.status(404).json({ success: false, error: 'Expense not found' });
        return;
      }

      // Update splits if provided
      if (splitData) {
        await db.delete(expenseSplits).where(eq(expenseSplits.expenseId, expense.id));
        if (splitData.length > 0) {
          await db.insert(expenseSplits).values(
            splitData.map((s) => ({
              expenseId: expense.id,
              userId: s.userId,
              amount: String(s.amount),
            }))
          );
        }
      }

      res.json({ success: true, data: expense });
    } catch (error) {
      console.error('Update expense error:', error);
      res.status(500).json({ success: false, error: 'Failed to update expense' });
    }
  }
);

// DELETE /api/trips/:id/expenses/:expenseId
expensesRouter.delete(
  '/:id/expenses/:expenseId',
  requireTripAccess('editor'),
  async (req: Request, res: Response) => {
    try {
      const [deleted] = await db
        .delete(expenses)
        .where(eq(expenses.id, req.params.expenseId as string))
        .returning();

      if (!deleted) {
        res.status(404).json({ success: false, error: 'Expense not found' });
        return;
      }

      res.json({ success: true, message: 'Expense deleted' });
    } catch (error) {
      console.error('Delete expense error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete expense' });
    }
  }
);

// GET /api/trips/:id/balances — calculate who owes whom
expensesRouter.get(
  '/:id/balances',
  requireTripAccess('viewer'),
  async (req: Request, res: Response) => {
    try {
      const tripId = req.params.id as string;

      // Get all members
      const members = await db
        .select({
          userId: tripMembers.userId,
          userName: users.name,
        })
        .from(tripMembers)
        .innerJoin(users, eq(tripMembers.userId, users.id))
        .where(eq(tripMembers.tripId, tripId));

      // Get total paid by each user
      const tripExpenses = await db
        .select()
        .from(expenses)
        .where(eq(expenses.tripId, tripId));

      // Get all splits
      const expenseIds = tripExpenses.map((e) => e.id);
      let allSplits: (typeof expenseSplits.$inferSelect)[] = [];

      if (expenseIds.length > 0) {
        allSplits = await db
          .select()
          .from(expenseSplits)
          .where(inArray(expenseSplits.expenseId, expenseIds));
      }

      // Calculate balances
      const balances = members.map((member) => {
        const totalPaid = tripExpenses
          .filter((e) => e.paidBy === member.userId)
          .reduce((sum, e) => sum + Number(e.amount), 0);

        const totalOwed = allSplits
          .filter((s) => s.userId === member.userId && !s.isSettled)
          .reduce((sum, s) => sum + Number(s.amount), 0);

        return {
          userId: member.userId,
          userName: member.userName,
          totalPaid,
          totalOwed,
          netBalance: totalPaid - totalOwed,
        };
      });

      // Calculate settlements (who pays whom)
      const settlements: { from: string; fromName: string; to: string; toName: string; amount: number }[] = [];
      const debtors = balances.filter((b) => b.netBalance < 0).map((b) => ({ ...b, remaining: Math.abs(b.netBalance) }));
      const creditors = balances.filter((b) => b.netBalance > 0).map((b) => ({ ...b, remaining: b.netBalance }));

      // Greedy settlement algorithm
      let i = 0;
      let j = 0;
      while (i < debtors.length && j < creditors.length) {
        const amount = Math.min(debtors[i].remaining, creditors[j].remaining);
        if (amount > 0.01) {
          settlements.push({
            from: debtors[i].userId,
            fromName: debtors[i].userName,
            to: creditors[j].userId,
            toName: creditors[j].userName,
            amount: Math.round(amount * 100) / 100,
          });
        }
        debtors[i].remaining -= amount;
        creditors[j].remaining -= amount;
        if (debtors[i].remaining < 0.01) i++;
        if (creditors[j].remaining < 0.01) j++;
      }

      res.json({ success: true, data: { balances, settlements } });
    } catch (error) {
      console.error('Calculate balances error:', error);
      res.status(500).json({ success: false, error: 'Failed to calculate balances' });
    }
  }
);

// PUT /api/trips/:id/expenses/splits/:splitId/settle
expensesRouter.put(
  '/:id/expenses/splits/:splitId/settle',
  requireTripAccess('editor'),
  async (req: Request, res: Response) => {
    try {
      const [split] = await db
        .update(expenseSplits)
        .set({ isSettled: true, settledAt: new Date() })
        .where(eq(expenseSplits.id, req.params.splitId as string))
        .returning();

      if (!split) {
        res.status(404).json({ success: false, error: 'Split not found' });
        return;
      }

      res.json({ success: true, data: split });
    } catch (error) {
      console.error('Settle split error:', error);
      res.status(500).json({ success: false, error: 'Failed to settle split' });
    }
  }
);
