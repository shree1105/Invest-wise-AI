import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { motion } from 'motion/react';
import { TrendingUp, Wallet, PieChart, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';

const RiskReturnChart: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-xl font-bold">Risk vs. Expected Return</h3>
      <span className="text-xs text-zinc-500">ML Prediction Analysis</span>
    </div>
    <div className="h-[300px] w-full" style={{ minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis type="number" dataKey="risk" name="Risk" unit="%" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Risk Score', position: 'insideBottom', offset: -10, fill: '#71717a', fontSize: 10 }} />
          <YAxis type="number" dataKey="return" name="Return" unit="%" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Exp. Return', angle: -90, position: 'insideLeft', fill: '#71717a', fontSize: 10 }} />
          <ZAxis type="number" range={[64, 144]} />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
          />
          <Scatter name="Investments" data={data} fill="#10b981">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.return > 10 ? '#10b981' : entry.return > 7 ? '#6366f1' : '#f59e0b'} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const StatCard: React.FC<{ title: string; value: string; trend?: number; icon: React.ReactNode }> = ({ title, value, trend, icon }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl space-y-4"
  >
    <div className="flex items-center justify-between">
      <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
        {icon}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center space-x-1 text-xs font-bold ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
          {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
    <div className="space-y-1">
      <p className="text-zinc-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-black tracking-tight">{value}</h3>
    </div>
  </motion.div>
);

const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [investments, setInvestments] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [stockPrices, setStockPrices] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch investments
    const invQuery = query(collection(db, 'investments'), where('uid', '==', user.uid));
    const unsubInv = onSnapshot(invQuery, (snap) => {
      const data = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .sort((a, b) => (b.date?.toDate?.() || 0) - (a.date?.toDate?.() || 0));
      setInvestments(data);
    });

    // Fetch recommendations
    const recQuery = query(collection(db, 'recommendations'), where('uid', '==', user.uid), limit(5));
    const unsubRec = onSnapshot(recQuery, (snap) => {
      const data = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .sort((a, b) => (b.date?.toDate?.() || 0) - (a.date?.toDate?.() || 0))
        .slice(0, 5);
      setRecommendations(data);
    });

    // Fetch stock prices
    const fetchStocks = async () => {
      try {
        const res = await fetch('/api/stock-prices');
        const data = await res.json();
        setStockPrices(data);
      } catch (error) {
        console.error('Failed to fetch stock prices');
      }
    };
    fetchStocks();
    const interval = setInterval(fetchStocks, 10000);

    return () => {
      unsubInv();
      unsubRec();
      clearInterval(interval);
    };
  }, [user]);

  const totalInvested = investments.reduce((acc, inv) => acc + inv.amount, 0);
  const avgReturn = investments.length > 0 ? (investments.reduce((acc, inv) => acc + inv.expectedReturn, 0) / investments.length).toFixed(1) : '0';

  const chartData = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 5000 },
    { name: 'Apr', value: 4500 },
    { name: 'May', value: 6000 },
    { name: 'Jun', value: 7500 },
  ];

  const pieData = [
    { name: 'Stocks', value: investments.filter(i => i.type === 'Stocks').reduce((acc, i) => acc + i.amount, 0) },
    { name: 'Mutual Funds', value: investments.filter(i => i.type === 'Mutual Funds').reduce((acc, i) => acc + i.amount, 0) },
    { name: 'Fixed Deposits', value: investments.filter(i => i.type === 'Fixed Deposits').reduce((acc, i) => acc + i.amount, 0) },
  ].filter(d => d.value > 0);

  const COLORS = ['#10b981', '#6366f1', '#f59e0b'];

  const riskReturnData = recommendations.map(r => ({
    risk: profile?.riskScore || 50,
    return: r.predictedReturn,
    name: r.type
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight">Dashboard</h2>
          <p className="text-zinc-500">Welcome back, {profile?.displayName || 'Investor'}. Here's your portfolio overview.</p>
        </div>
        <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl text-sm font-medium text-emerald-500">
          <Activity size={16} />
          <span>Market Open</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Invested" value={`$${totalInvested.toLocaleString()}`} trend={12.5} icon={<Wallet />} />
        <StatCard title="Avg. Expected Return" value={`${avgReturn}%`} trend={2.1} icon={<TrendingUp />} />
        <StatCard title="Active Assets" value={investments.length.toString()} icon={<PieChart />} />
        <StatCard title="Risk Level" value={profile?.riskTolerance?.toUpperCase() || 'N/A'} icon={<Activity />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="lg:col-span-1">
          <RiskReturnChart data={riskReturnData} />
        </div>
        <div className="lg:col-span-1">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-6 h-full">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Portfolio Performance</h3>
              <select className="bg-zinc-800 border-none rounded-lg text-sm px-3 py-1 outline-none">
                <option>Last 6 Months</option>
                <option>Last Year</option>
              </select>
            </div>
            <div className="h-[250px] w-full" style={{ minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

        {/* Asset Allocation */}
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-6">
          <h3 className="text-xl font-bold">Asset Allocation</h3>
          <div className="h-[250px] w-full flex items-center justify-center" style={{ minWidth: 0 }}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center space-y-2">
                <PieChart className="w-12 h-12 text-zinc-700 mx-auto" />
                <p className="text-zinc-500 text-sm">No investments yet</p>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {pieData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-zinc-400">{item.name}</span>
                </div>
                <span className="font-bold">${item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Live Market */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-xl font-bold">Live Market</h3>
            <span className="text-xs text-zinc-500">Real-time data via Yahoo Finance</span>
          </div>
          <div className="divide-y divide-zinc-800">
            {stockPrices.map((stock) => (
              <div key={stock.symbol} className="p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center font-bold text-xs">
                    {stock.symbol}
                  </div>
                  <div>
                    <p className="font-bold">{stock.name}</p>
                    <p className="text-xs text-zinc-500">{stock.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">${stock.price.toFixed(2)}</p>
                  <p className={`text-xs ${stock.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Recommendations */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-xl font-bold">Latest Recommendations</h3>
            <Link to="/recommendations" className="text-emerald-500 text-sm font-bold hover:underline">View All</Link>
          </div>
          <div className="p-6 space-y-6">
            {recommendations.length > 0 ? (
              recommendations.map((rec) => (
                <div key={rec.id} className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
                    <TrendingUp size={20} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold">{rec.type}</p>
                      <span className="text-emerald-500 font-bold">+{rec.predictedReturn}%</span>
                    </div>
                    <p className="text-sm text-zinc-500 line-clamp-2">{rec.reason}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 space-y-4">
                <Activity className="w-12 h-12 text-zinc-700 mx-auto" />
                <p className="text-zinc-500">Complete your risk profile to get recommendations.</p>
                <Link to="/profile" className="inline-block bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold">Setup Profile</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
