import React, { useState, useEffect } from 'react';
import { PieChart, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import api from '../services/api';

export default function Analytics() {
  const [totalSpending, setTotalSpending] = useState({ total_amount: 0, total_count: 0 });
  const [categories, setCategories] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [totRes, catRes, monRes] = await Promise.all([
        api.get('/analytics/total'),
        api.get('/analytics/categories'),
        api.get('/analytics/monthly'),
      ]);

      setTotalSpending(totRes.data);
      setCategories(catRes.data.categories || []);
      setMonthly(monRes.data.months || []);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Spending Analytics</h1>
        <p className="text-sm text-slate-500">In-depth breakdown of your category spending and monthly trends.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">All-Time Spending</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              ${Number(totalSpending.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recorded Expenses</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{totalSpending.total_count || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-600" />
              Category Breakdown
            </h2>
          </div>

          {categories.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">No category data available.</p>
          ) : (
            <div className="space-y-4">
              {categories.map((c) => (
                <div key={c.category} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-800">{c.category}</span>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">${Number(c.total_amount).toFixed(2)}</span>
                      <span className="text-xs text-slate-400 ml-2">({c.percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(c.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Summary */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Monthly Summary
            </h2>
          </div>

          {monthly.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">No monthly history available.</p>
          ) : (
            <div className="space-y-3 divide-y divide-slate-100">
              {monthly.map((m) => (
                <div key={`${m.year}-${m.month}`} className="pt-3 first:pt-0 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      {monthNames[m.month - 1] || m.month} {m.year}
                    </p>
                    <p className="text-xs text-slate-500">{m.count} transactions</p>
                  </div>
                  <p className="font-bold text-slate-900 text-base">
                    ${Number(m.total_amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

