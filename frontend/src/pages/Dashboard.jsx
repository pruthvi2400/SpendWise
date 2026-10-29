import React, { useState, useEffect } from "react";
import { DollarSign, Receipt, PieChart, Wallet, ArrowUpRight, Plus, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Dashboard() {
  const [totalSpending, setTotalSpending] = useState({ total_amount: 0, total_count: 0 });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [totalRes, expensesRes, budgetsRes, categoryRes] = await Promise.all([
        api.get("/analytics/total"),
        api.get("/expenses?limit=5"),
        api.get("/budgets"),
        api.get("/analytics/categories"),
      ]);

      setTotalSpending(totalRes.data);
      setRecentExpenses(expensesRes.data.items || []);
      setBudgets(budgetsRes.data || []);
      setCategoryBreakdown(categoryRes.data.categories || []);
      setError(null);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
      setError("Could not connect to FastAPI backend or load metrics.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Dashboard</h1>
          <p className="text-sm text-slate-500">Real-time overview from your SpendWise backend.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/expenses"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
          <span>{error} Make sure your FastAPI backend is running at http://127.0.0.1:8000.</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Spending</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              ${Number(totalSpending.total_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Transactions</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalSpending.total_count || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Budgets</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{budgets.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Categories Used</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{categoryBreakdown.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <PieChart className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Recent Expenses</h2>
            <Link to="/expenses" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              View all <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {recentExpenses.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No expenses recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Title</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {recentExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 font-semibold text-slate-900">{exp.title}</td>
                      <td className="py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">{exp.expense_date}</td>
                      <td className="py-3 text-right font-bold text-slate-900">
                        ${Number(exp.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Top Categories</h2>
            <Link to="/analytics" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              Analytics <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <PieChart className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No category data available.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categoryBreakdown.slice(0, 5).map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-800">{cat.category}</span>
                    <span className="font-bold text-slate-900">${Number(cat.total_amount).toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
