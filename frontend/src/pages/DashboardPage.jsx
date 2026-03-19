import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getDashboardWidgets, getOrders } from '../services/api';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Area, AreaChart, Cell
} from 'recharts';

/* ─────────────────────────────────────────
   CUSTOM TOOLTIP
───────────────────────────────────────── */
const DarkTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1d2e] border border-white/10 rounded-2xl px-4 py-3 shadow-2xl">
        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-lg font-black text-white">{payload[0]?.value?.toLocaleString?.() ?? payload[0]?.value}</p>
      </div>
    );
  }
  return null;
};

/* ─────────────────────────────────────────
   KPI CARD
───────────────────────────────────────── */
const GRADIENTS = [
  { from: '#6366f1', to: '#8b5cf6' },
  { from: '#0ea5e9', to: '#38bdf8' },
  { from: '#10b981', to: '#34d399' },
  { from: '#f97316', to: '#fbbf24' },
];

const KPIWidget = ({ label, value, icon, idx }) => {
  const g = GRADIENTS[idx % GRADIENTS.length];
  return (
    <div className="relative overflow-hidden rounded-[2rem] p-[1px] group" style={{ background: `linear-gradient(135deg, ${g.from}33, ${g.to}22)` }}>
      <div className="relative bg-[#12152a] rounded-[2rem] p-7 flex flex-col gap-5 h-full overflow-hidden hover:bg-[#161930] transition-all duration-500">
        {/* glow blob */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 blur-2xl transition-all duration-700 group-hover:opacity-40" style={{ background: g.from }} />
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xl" style={{ background: `linear-gradient(135deg, ${g.from}33, ${g.to}22)`, border: `1px solid ${g.from}44` }}>
            {icon}
          </div>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: g.from, boxShadow: `0 0 8px ${g.from}` }} />
        </div>
        <div>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em] mb-2">{label}</p>
          <p className="text-3xl font-black text-white tracking-tighter">{value}</p>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   BAR CHART
───────────────────────────────────────── */
const BAR_COLORS = ['#6366f1', '#8b5cf6', '#0ea5e9', '#10b981', '#f97316', '#ec4899'];

const BarChartWidget = ({ title, orders }) => {
  const data = useMemo(() => {
    const agg = {};
    orders.forEach(o => {
      agg[o.product] = (agg[o.product] || 0) + (parseFloat(o.totalAmount) || 0);
    });
    return Object.keys(agg).map(k => ({ product: k, revenue: agg[k] }));
  }, [orders]);

  return (
    <div className="relative bg-[#12152a] rounded-[2rem] p-7 border border-white/5 overflow-hidden group hover:border-white/10 transition-all duration-500 h-[340px] flex flex-col">
      <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl group-hover:opacity-70 transition-opacity" />
      <div className="flex items-center gap-3 mb-6 flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
        <h4 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em]">{title}</h4>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="product" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontWeight: 700 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontWeight: 700 }} axisLine={false} tickLine={false} />
            <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="revenue" radius={[8, 8, 0, 0]} barSize={36}>
              {data.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} fillOpacity={0.9} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   LINE / AREA CHART
───────────────────────────────────────── */
const LineChartWidget = ({ title, orders }) => {
  const data = useMemo(() => {
    const agg = {};
    orders.forEach(o => {
      const date = new Date(o.orderDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      agg[date] = (agg[date] || 0) + 1;
    });
    return Object.keys(agg).map(k => ({ date: k, count: agg[k] }));
  }, [orders]);

  return (
    <div className="relative bg-[#12152a] rounded-[2rem] p-7 border border-white/5 overflow-hidden group hover:border-white/10 transition-all duration-500 h-[340px] flex flex-col">
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl group-hover:opacity-70 transition-opacity" />
      <div className="flex items-center gap-3 mb-6 flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
        <h4 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em]">{title}</h4>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontWeight: 700 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontWeight: 700 }} axisLine={false} tickLine={false} />
            <Tooltip content={<DarkTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
            <Area type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#areaGrad)" dot={{ r: 5, fill: '#0ea5e9', strokeWidth: 2, stroke: '#12152a' }} activeDot={{ r: 8, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   TABLE WIDGET
───────────────────────────────────────── */
const STATUS_STYLES = {
  Completed: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  Pending:   'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  'In Progress': 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  Cancelled: 'bg-red-500/15 text-red-400 border border-red-500/30',
};

const TableWidget = ({ title, orders }) => (
  <div className="bg-[#12152a] rounded-[2rem] border border-white/5 overflow-hidden hover:border-white/10 transition-all duration-500">
    <div className="px-8 py-6 border-b border-white/5 flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
      <h4 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em]">{title}</h4>
      <div className="ml-auto px-3 py-1 bg-white/5 rounded-full text-[9px] font-black text-white/30 uppercase tracking-widest">{orders.length} Records</div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/5">
            {['Customer', 'Product', 'Amount', 'Status', 'Date'].map(h => (
              <th key={h} className="px-8 py-4 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((o, i) => (
            <tr key={o.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors group/row">
              <td className="px-8 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/20 flex items-center justify-center text-xs font-black text-indigo-300 border border-indigo-500/20">
                    {o.firstName?.[0]}{o.lastName?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white/90">{o.firstName} {o.lastName}</p>
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-wider">{o.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-8 py-5 text-sm text-white/50 font-medium">{o.product}</td>
              <td className="px-8 py-5">
                <span className="text-sm font-black text-white">${parseFloat(o.totalAmount).toLocaleString()}</span>
              </td>
              <td className="px-8 py-5">
                <span className={`px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-wider ${STATUS_STYLES[o.status] || STATUS_STYLES.Pending}`}>
                  {o.status}
                </span>
              </td>
              <td className="px-8 py-5 text-xs text-white/30 font-medium">{new Date(o.orderDate).toLocaleDateString()}</td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan="5" className="px-8 py-16 text-center text-white/20 text-sm font-bold uppercase tracking-widest">No active records for this period</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const DashboardPage = () => {
  const navigate = useNavigate();
  const [widgets, setWidgets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dateFilter, setDateFilter] = useState("All time");
  const [loading, setLoading] = useState(true);
  const [refreshCountdown, setRefreshCountdown] = useState(10);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Initial load + re-fetch when filter changes
  useEffect(() => {
    fetchData(true);
  }, [dateFilter]);

  // Auto-refresh polling every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          fetchData(false); // silent refresh (no loading spinner)
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [dateFilter]);

  const fetchData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const [wRes, oRes] = await Promise.all([
        getDashboardWidgets(dateFilter),
        getOrders(dateFilter)
      ]);
      setWidgets(wRes.data.widgets || []);
      setOrders(oRes.data || []);
      setLastRefreshed(new Date());
      setRefreshCountdown(5);
    } catch (err) {
      console.error('Data sync failed:', err);
    } finally {
      if (showLoader) setTimeout(() => setLoading(false), 400);
    }
  };

  const stats = useMemo(() => {
    const totalRev = orders.reduce((s, o) => s + (parseFloat(o.totalAmount) || 0), 0);
    const completed = orders.filter(o => o.status === 'Completed').length;
    const pending = orders.filter(o => o.status === 'Pending').length;
    return {
      revenue: `$${totalRev.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      orders: orders.length,
      completed: orders.length ? `${Math.round((completed / orders.length) * 100)}%` : '0%',
      pending: orders.length ? `${Math.round((pending / orders.length) * 100)}%` : '0%',
    };
  }, [orders]);

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0b0e1c] font-['Outfit',sans-serif] text-white selection:bg-indigo-500/30">

      {/* ── ANIMATED BG ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b0e1c] via-[#0f1326] to-[#0b0e1c]" />
        <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-indigo-700/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] bg-cyan-600/8 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '11s', animationDelay: '3s' }} />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-purple-700/8 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '14s', animationDelay: '6s' }} />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 inset-x-0 h-[64px] bg-[#0b0e1c]/80 backdrop-blur-2xl border-b border-white/[0.06] z-[100] px-8 flex items-center justify-between shadow-[0_1px_0_rgba(255,255,255,0.03)]">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-base shadow-lg shadow-indigo-500/30">📊</div>
            <span className="text-base font-black text-white uppercase tracking-tighter italic">DashBuilder</span>
          </div>
          <div className="hidden md:flex items-center gap-1 h-[64px]">
            <Link to="/dashboard" className="relative h-full flex items-center px-4 text-xs font-black text-indigo-400 uppercase tracking-widest group">
              Dashboard
              <span className="absolute bottom-0 inset-x-4 h-[2px] rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8]" />
            </Link>
            <Link to="/customer-orders" className="h-full flex items-center px-4 text-xs font-black text-white/30 uppercase tracking-widest hover:text-white/70 transition-colors">
              Customer Orders
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* ── Auto-refresh indicator ── */}
          <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.06] px-4 py-2 rounded-2xl">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Sync in</span>
            <span className="text-emerald-400 font-mono font-bold text-xs w-5 text-center">{refreshCountdown}s</span>
          </div>
          <div className="flex items-center gap-3 bg-white/[0.05] border border-white/[0.08] px-4 py-2 rounded-2xl">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-[11px] font-black shadow-lg shadow-indigo-500/20">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <span className="text-xs font-black text-white/70 tracking-tight">{user?.name || 'Admin User'}</span>
          </div>
          <button onClick={handleLogout} className="text-xs font-black text-red-400/70 hover:text-red-400 px-4 py-2 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 transition-all uppercase tracking-widest">
            Logout
          </button>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <main className="relative z-10 pt-[88px] px-8 max-w-[1400px] mx-auto pb-24">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <p className="text-[10px] font-black text-indigo-400/70 uppercase tracking-[0.4em] mb-2">Analytics Hub</p>
            <h1 className="text-4xl font-black text-white tracking-tighter leading-tight">Dashboard <span className="text-white/20">Overview</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-white/[0.05] border border-white/[0.08] text-white/70 text-xs font-black uppercase tracking-widest rounded-2xl px-5 py-3 outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] cursor-pointer appearance-none pr-10 transition-all"
              >
                {['All time', 'Today', 'Last 7 Days', 'Last 30 Days', 'Last 90 Days'].map(o => (
                  <option key={o} className="bg-[#12152a]">{o}</option>
                ))}
              </select>
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/></svg>
            </div>
            <button
              onClick={() => fetchData(false)}
              title="Refresh now"
              className="w-11 h-11 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] rounded-2xl flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-95"
            >
              🔄
            </button>
            <button
              onClick={() => navigate('/dashboard/configure')}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-7 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 active:scale-95 transition-all"
            >
              Configure Dashboard
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-48">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
              <div className="absolute inset-3 rounded-full bg-indigo-500/10 animate-pulse" />
            </div>
            <p className="mt-8 text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Syncing Data Streams...</p>
          </div>
        ) : widgets.length === 0 ? (
          <div className="relative bg-[#12152a] border border-white/5 rounded-[3rem] p-24 md:p-40 flex flex-col items-center text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-purple-900/10" />
            <div className="relative w-28 h-28 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center text-5xl mb-10 border border-indigo-500/20 shadow-[0_0_60px_rgba(99,102,241,0.1)]">📊</div>
            <h3 className="relative text-3xl font-black text-white tracking-tighter mb-4">No Widgets Configured</h3>
            <p className="relative text-white/30 font-medium mb-12 max-w-sm leading-relaxed">Your dashboard canvas is empty. Configure widgets to start visualizing your operational intelligence.</p>
            <button onClick={() => navigate('/dashboard/configure')} className="relative bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-12 py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/40 active:scale-95 transition-all">
              Configure Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <KPIWidget label="Total Revenue"   value={stats.revenue}   icon="💎" idx={0} />
              <KPIWidget label="Total Orders"    value={stats.orders}    icon="📦" idx={1} />
              <KPIWidget label="Completed"       value={stats.completed} icon="✅" idx={2} />
              <KPIWidget label="Pending"         value={stats.pending}   icon="⚡" idx={3} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BarChartWidget  title="Revenue by Product" orders={orders} />
              <LineChartWidget title="Orders Over Time"   orders={orders} />
            </div>

            {/* Table */}
            <TableWidget title="Customer Orders Table" orders={orders.slice(0, 15)} />

          </div>
        )}
      </main>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
      `}</style>
    </div>
  );
};

export default DashboardPage;
