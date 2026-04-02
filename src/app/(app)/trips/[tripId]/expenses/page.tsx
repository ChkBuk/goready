'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Receipt, ArrowRight, Pencil, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: string;
  currency: string;
  date: string;
  paidBy: string;
  splitType: string;
}

interface Balance {
  userId: string;
  userName: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
}

interface Settlement {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

const categoryLabels: Record<string, string> = {
  food: 'Food',
  transport: 'Transport',
  accommodation: 'Accommodation',
  activity: 'Activity',
  shopping: 'Shopping',
  other: 'Other',
};

export default function TripExpensesPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const { data: expenses } = useQuery({
    queryKey: ['expenses', tripId],
    queryFn: async () => {
      const res = await api.get<Expense[]>(`/api/trips/${tripId}/expenses`);
      return res.data || [];
    },
  });

  const { data: balances } = useQuery({
    queryKey: ['balances', tripId],
    queryFn: async () => {
      const res = await api.get<{ balances: Balance[]; settlements: Settlement[] }>(
        `/api/trips/${tripId}/balances`
      );
      return res.data;
    },
  });

  const saveExpense = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        amount: parseFloat(amount),
        category,
        date: expenseDate,
        splitType: 'equal',
      };
      if (editingExpense) {
        const res = await api.put(`/api/trips/${tripId}/expenses/${editingExpense.id}`, payload);
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await api.post(`/api/trips/${tripId}/expenses`, payload);
        if (!res.success) throw new Error(res.error);
      }
    },
    onSuccess: () => {
      toast.success(editingExpense ? 'Expense updated!' : 'Expense added!');
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['expenses', tripId] });
      queryClient.invalidateQueries({ queryKey: ['balances', tripId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteExpense = useMutation({
    mutationFn: async (expenseId: string) => {
      const res = await api.delete(`/api/trips/${tripId}/expenses/${expenseId}`);
      if (!res.success) throw new Error(res.error as string);
    },
    onSuccess: () => {
      toast.success('Expense deleted');
      queryClient.invalidateQueries({ queryKey: ['expenses', tripId] });
      queryClient.invalidateQueries({ queryKey: ['balances', tripId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function resetForm() {
    setTitle('');
    setAmount('');
    setCategory('food');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setShowForm(false);
    setEditingExpense(null);
  }

  function startEdit(expense: Expense) {
    setEditingExpense(expense);
    setTitle(expense.title);
    setAmount(expense.amount);
    setCategory(expense.category);
    setExpenseDate(expense.date?.split('T')[0] || new Date().toISOString().split('T')[0]);
    setShowForm(true);
  }

  const total = (expenses || []).reduce(
    (sum, e) => sum + parseFloat(e.amount),
    0
  );

  return (
    <div className="px-6 py-6 md:px-10 md:py-10 max-w-2xl mx-auto">
      <Link href={`/trips/${tripId}`} className="inline-flex items-center text-base font-medium text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Back to Trip
      </Link>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-medium tracking-tight">Expenses</h1>
        <div className="text-right">
          <p className="text-3xl font-medium">${total.toFixed(2)}</p>
          <p className="text-base text-muted-foreground">Total spent</p>
        </div>
      </div>

      {/* Settlements */}
      {balances?.settlements && balances.settlements.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Settle Up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {balances.settlements.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-[0.9375rem]"
              >
                <span className="font-medium">{s.fromName}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{s.toName}</span>
                <span className="ml-auto font-semibold text-primary">
                  ${s.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit expense form */}
      {showForm ? (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-medium">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h3>
              <button onClick={resetForm} className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveExpense.mutate();
              }}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <Label htmlFor="expTitle">Description</Label>
                <Input
                  id="expTitle"
                  placeholder="e.g., Lunch at restaurant"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="expAmount">Amount</Label>
                  <Input
                    id="expAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="expCategory">Category</Label>
                  <select
                    id="expCategory"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {Object.entries(categoryLabels).map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expDate">Date</Label>
                <Input
                  id="expDate"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={saveExpense.isPending}
                >
                  {saveExpense.isPending ? 'Saving...' : (editingExpense ? 'Save Changes' : 'Add Expense')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          className="w-full mb-4"
          onClick={() => { setEditingExpense(null); setShowForm(true); }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      )}

      {/* Expense list */}
      {expenses && expenses.length > 0 ? (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <Card key={expense.id} className="group">
              <CardContent className="flex items-center gap-3 p-5">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted">
                  <Receipt className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium truncate">{expense.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(expense.date), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div>
                    <p className="text-lg font-semibold">
                      ${parseFloat(expense.amount).toFixed(2)}
                    </p>
                    <Badge variant="secondary" className="mt-0.5">
                      {categoryLabels[expense.category] || expense.category}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted"
                      onClick={() => startEdit(expense)}
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                      className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-destructive/10"
                      onClick={() => deleteExpense.mutate(expense.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Receipt className="h-12 w-12 mx-auto mb-2 opacity-30" />
          <p>No expenses recorded yet.</p>
        </div>
      )}
    </div>
  );
}
