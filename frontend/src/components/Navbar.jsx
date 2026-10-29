import React from 'react';
import { Menu, Bell, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ setMobileOpen }) {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-6 shadow-xs">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
          aria-label="Open sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 lg:hidden">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <span className="font-bold text-slate-900">SpendWise</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Live FastAPI Connected
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs font-medium text-slate-500">Signed in as</p>
          <p className="text-sm font-semibold text-slate-800">{user?.email}</p>
        </div>
      </div>
    </header>
  );
}
