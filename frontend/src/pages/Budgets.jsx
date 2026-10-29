import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Trash2, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import api from '../services/api';

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [budgetStatuses, setBudgetStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Food & Dining',
    amount_limit: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    'Food & Dining', 'Housing & Rent', 'Transportation', 'Utilities',
    'Entertainment', 'Shopping', 'Health & Fitness', 'Other',
  ];

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/budgets');
      const list = res.data || [];
      setBudgets(list);

      const statusMap = {};
      await Promise.all(
        list.map(async (b) => {
          try {
            const stRes = await api.get(`/budgets/${b.id}/status`);
            statusMap[b.id] = stRes.data;
          } catch (e) {
            console.error(`Failed status for budget ${b.id}`, e);
          }
        })
      );
      setBudgetStatuses(statusMap);
    } catch (err) {
      console.error('Failed to load budgets', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/budgets', {
        ...formData,
        amount_limit: parseFloat(formData.amount_limit),
        month: parseInt(formData.month),
        year: parseInt(formData.year),
      });
      setIsModalOpen(false);
      setFormData({
        category: 'Food & Dining', amount_limit: '',
        month: new Date().getMonth() + 1, year: new Date().getFullYear(),
      });
      fetchBudgets();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create budget');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      fetchBudgets();
    } catch (err) {
      alert('Failed to delete budget');
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Monthly Budgets</h1>
          <p className="text-sm text-slate-500">Track and manage category budgets against your actual spending.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Set New Budget
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading budgets...</div>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-xs">
          <Wallet className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-base font-semibold text-slate-800">No budgets set</p>
          <p className="text-sm text-slate-500 mt-1">Set a monthly category budget to monitor spending.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((b) => {
            const status = budgetStatuses[b.id] || {
              total_spent: 0,
              remaining: b.amount_limit,
              percentage_used: 0,
              is_over_budget: false,
            };
            const isOver = status.is_over_budget;
            const pct = Math.min(status.percentage_used, 100);

            return (
              <div key={b.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {b.category}
                    </span>
                    <button
                      onClick={() => handleDeleteBudget(b.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete Budget"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">
                    Month: {b.month}/{b.year}
                  </p>
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Spent</p>
                      <p className="text-xl font-bold text-slate-900">${Number(status.total_spent).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Limit</p>
                      <p className="text-xl font-bold text-slate-700">${Number(b.amount_limit).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className={isOver ? 'text-red-600' : 'text-slate-600'}>
                        {status.percentage_used}% used
                      </span>
                      <span className={isOver ? 'text-red-600' : 'text-emerald-600'}>
                        ${Number(status.remaining).toFixed(2)} remaining
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOver ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
                  {isOver ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg w-full">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" /> Over budget!
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg w-full">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Within limit
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}


      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Set Monthly Budget</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</div>}
            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Limit ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount_limit}
                  onChange={(e) => setFormData({ ...formData, amount_limit: e.target.value })}
                  placeholder="500.00"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Month (1-12)</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    required
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Year</label>
                  <input
                    type="number"
                    required
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700"
                >
                  {submitting ? 'Saving...' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
