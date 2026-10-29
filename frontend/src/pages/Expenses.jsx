import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Receipt, X, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Food & Dining',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');

  const categories = ['Food & Dining', 'Housing & Rent', 'Transportation', 'Utilities', 'Entertainment', 'Shopping', 'Health & Fitness', 'Other'];

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/expenses?limit=50');
      setExpenses(res.data.items || []);
    } catch (err) {
      console.error('Failed to load expenses', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', { ...formData, amount: parseFloat(formData.amount) });
      setIsModalOpen(false);
      fetchExpenses();
    } catch (err) {
      setError('Failed to create expense');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    await api.delete(`/expenses/${id}`);
    fetchExpenses();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl">Add Expense</button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        {loading ? <p>Loading...</p> : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-xs uppercase">
                <th className="py-3">Title</th>
                <th className="py-3">Category</th>
                <th className="py-3">Amount</th>
                <th className="py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((exp) => (
                <tr key={exp.id}>
                  <td className="py-4">{exp.title}</td>
                  <td className="py-4">{exp.category}</td>
                  <td className="py-4">${Number(exp.amount).toFixed(2)}</td>
                  <td className="py-4">
                    <button onClick={() => handleDeleteExpense(exp.id)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleCreateExpense} className="bg-white p-6 rounded-2xl w-full max-w-sm space-y-4">
            <h3 className="font-bold">Add Expense</h3>
            <input type="text" required onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full p-2 border rounded" placeholder="Title" />
            <input type="number" required onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full p-2 border rounded" placeholder="Amount" />
            <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded">Save</button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="w-full py-2">Cancel</button>
          </form>
        </div>
      )}
    </div>
  );
}
