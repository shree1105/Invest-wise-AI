import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Users, TrendingUp, ShieldCheck, Activity, Globe, MessageSquare } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [marketInsights, setMarketInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role !== 'admin') return;

    // Fetch all users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch market insights from our API
    const fetchInsights = async () => {
      try {
        const res = await fetch('/api/market-insights');
        const data = await res.json();
        setMarketInsights(data);
      } catch (error) {
        console.error('Failed to fetch insights');
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();

    return () => unsubUsers();
  }, [profile]);

  if (profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <ShieldCheck size={64} className="text-red-500" />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-zinc-500">You do not have administrative privileges.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight">Admin Console</h2>
          <p className="text-zinc-500">Platform-wide overview and market intelligence.</p>
        </div>
        <div className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/20">
          Admin Mode
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
            <Users size={20} />
          </div>
          <div>
            <p className="text-zinc-500 text-sm font-medium">Total Users</p>
            <h3 className="text-2xl font-black tracking-tight">{users.length}</h3>
          </div>
        </div>
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-zinc-500 text-sm font-medium">Active Sessions</p>
            <h3 className="text-2xl font-black tracking-tight">12</h3>
          </div>
        </div>
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
            <Globe size={20} />
          </div>
          <div>
            <p className="text-zinc-500 text-sm font-medium">Market Status</p>
            <h3 className="text-2xl font-black tracking-tight">Global</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Management */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800">
            <h3 className="text-xl font-bold">User Directory</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase font-bold">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-bold">{u.displayName || 'N/A'}</td>
                    <td className="px-6 py-4 text-zinc-400">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                        u.role === 'admin' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block mr-2" />
                      <span className="text-xs text-zinc-500">Online</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Market Insights */}
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-6">
          <h3 className="text-xl font-bold flex items-center space-x-2">
            <MessageSquare className="text-emerald-500" size={20} />
            <span>Market Intelligence</span>
          </h3>
          
          <div className="space-y-6">
            {marketInsights ? (
              <div className="space-y-4">
                <div className="p-4 bg-zinc-800 rounded-2xl space-y-2">
                  <p className="text-xs text-zinc-500 font-bold uppercase">Alpha Vantage Insight</p>
                  <p className="text-sm leading-relaxed text-zinc-300">
                    {marketInsights.insights || JSON.stringify(marketInsights, null, 2)}
                  </p>
                </div>
                <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-2xl">
                  <span className="text-sm font-medium">Sentiment Score</span>
                  <span className="text-emerald-500 font-bold">{marketInsights.sentiment || 'Positive'}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <Activity className="animate-pulse text-zinc-700" size={32} />
              </div>
            )}

            <div className="p-4 border border-zinc-800 rounded-2xl space-y-3">
              <h4 className="text-sm font-bold">System Health</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">API Latency</span>
                  <span className="text-emerald-500">24ms</span>
                </div>
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="w-[90%] h-full bg-emerald-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
