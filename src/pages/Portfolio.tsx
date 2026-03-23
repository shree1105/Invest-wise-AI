import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Wallet, TrendingUp, PieChart, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

const Portfolio: React.FC = () => {
  const { user } = useAuth();
  const [investments, setInvestments] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'investments'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .sort((a, b) => (b.date?.toDate?.() || 0) - (a.date?.toDate?.() || 0));
      setInvestments(data);
    });
    return () => unsubscribe();
  }, [user]);

  const totalInvested = investments.reduce((acc, inv) => acc + inv.amount, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight">Portfolio Overview</h2>
          <p className="text-zinc-500">Track and manage your active investments in one place.</p>
        </div>
        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
          <Wallet size={24} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4">
          <p className="text-sm text-zinc-500 font-medium">Total Portfolio Value</p>
          <h3 className="text-4xl font-black tracking-tight">${totalInvested.toLocaleString()}</h3>
          <div className="flex items-center space-x-2 text-emerald-500 text-sm font-bold">
            <ArrowUpRight size={16} />
            <span>+12.5% All Time</span>
          </div>
        </div>
        <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4">
          <p className="text-sm text-zinc-500 font-medium">Active Assets</p>
          <h3 className="text-4xl font-black tracking-tight">{investments.length}</h3>
          <p className="text-zinc-500 text-sm">Diversified across {new Set(investments.map(i => i.type)).size} types</p>
        </div>
        <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4">
          <p className="text-sm text-zinc-500 font-medium">Projected Annual Return</p>
          <h3 className="text-4xl font-black tracking-tight">
            ${(investments.reduce((acc, inv) => acc + (inv.amount * inv.expectedReturn / 100), 0)).toLocaleString()}
          </h3>
          <p className="text-zinc-500 text-sm">Estimated based on ML predictions</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <h3 className="text-xl font-bold">Active Investments</h3>
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 bg-zinc-800 rounded-xl text-sm font-bold hover:bg-zinc-700 transition-all">Export CSV</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-8 py-4">Asset Type</th>
                <th className="px-8 py-4">Amount Invested</th>
                <th className="px-8 py-4">Expected Return</th>
                <th className="px-8 py-4">Tenure</th>
                <th className="px-8 py-4">Date</th>
                <th className="px-8 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {investments.length > 0 ? (
                investments.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                          inv.type === 'Stocks' ? 'bg-indigo-500/10 text-indigo-500' :
                          inv.type === 'Mutual Funds' ? 'bg-emerald-500/10 text-emerald-500' :
                          'bg-amber-500/10 text-amber-500'
                        }`}>
                          {inv.type[0]}
                        </div>
                        <span className="font-bold">{inv.type}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-bold">${inv.amount.toLocaleString()}</td>
                    <td className="px-8 py-6">
                      <span className="text-emerald-500 font-bold">+{inv.expectedReturn}%</span>
                    </td>
                    <td className="px-8 py-6 text-zinc-400">{inv.tenure} Years</td>
                    <td className="px-8 py-6 text-zinc-400">
                      {inv.date?.toDate ? inv.date.toDate().toLocaleDateString() : new Date(inv.date).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-full border border-emerald-500/20">
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center space-y-4">
                    <Activity className="w-12 h-12 text-zinc-700 mx-auto" />
                    <div className="space-y-1">
                      <p className="text-zinc-500 font-bold">No investments found</p>
                      <p className="text-xs text-zinc-600">Start investing through our AI recommendations.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
