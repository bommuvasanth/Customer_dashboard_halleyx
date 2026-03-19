import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders, createOrder, updateOrder, deleteOrder } from '../services/api';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { ResponsiveGridLayout } from 'react-grid-layout';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [dateFilter, setDateFilter] = useState('All time');
  const [dashboardConfig, setDashboardConfig] = useState({ widgets: [], layouts: { lg: [] } });
  const [refreshCountdown, setRefreshCountdown] = useState(10);

  console.log('AdminDashboard Initialized');
  
  // Order Management State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    streetAddress: '', city: '', state: '', postalCode: '', country: '',
    product: '', quantity: 1, unitPrice: '', status: 'Pending', createdBy: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    fetchOrders();
    const intervalId = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          fetchOrders();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    const handleGlobalClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleGlobalClick);

    const saved = localStorage.getItem('halleyx_dashboard_config');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        setDashboardConfig({
          widgets: parsed.widgets || [],
          layouts: parsed.layouts || { lg: [] }
        });
      } catch (_) {
        setDashboardConfig({ widgets: [], layouts: { lg: [] } });
      }
    } else {
      setDashboardConfig({ widgets: [], layouts: { lg: [] } });
    }

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await getOrders();
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const filteredOrders = useMemo(() => {
    if (dateFilter === 'All time') return orders;
    const now = new Date();
    const daysAgo = { 'Today': 0, 'Last 7 Days': 7, 'Last 30 Days': 30, 'Last 90 Days': 90 }[dateFilter];
    if (daysAgo === 0) return orders?.filter(o => new Date(o.orderDate).toDateString() === now.toDateString());
    const cutoffDate = new Date(now - daysAgo * 86400000);
    return orders?.filter(order => new Date(order.orderDate) >= cutoffDate);
  }, [orders, dateFilter]);

  const stats = useMemo(() => {
    const total = filteredOrders?.length || 0;
    const revenue = filteredOrders?.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0) || 0;
    const pending = filteredOrders?.filter(o => o.status === 'Pending').length || 0;
    const completed = filteredOrders?.filter(o => o.status === 'Completed').length || 0;
    
    // Unique Feature: Top Product Insight
    const productCounts = {};
    filteredOrders?.forEach(o => {
      productCounts[o.product] = (productCounts[o.product] || 0) + 1;
    });
    const topProduct = Object.entries(productCounts).sort((a,b) => b[1]-a[1])[0]?.[0] || 'N/A';

    return { total, revenue, pending, completed, topProduct };
  }, [filteredOrders]);

  console.log('Current Stats:', stats);

  const renderWidget = (widget) => {
    const { type, config } = widget;
    if (type === 'KPI Value' || type === 'KPI') {
       const metric = config.metric || 'Total Amount';
       const kpiMap = { 'Customer ID': 'id', 'Customer name': 'firstName', 'Email id': 'email', 'Address': 'city', 'Order date': 'orderDate', 'Product': 'product', 'Created by': 'createdBy', 'Status': 'status', 'Total amount': 'totalAmount', 'Unit price': 'unitPrice', 'Quantity': 'quantity' };
       const mapKey = kpiMap[metric] || 'totalAmount';
       let value = 0;
       const numericFields = ['totalAmount', 'unitPrice', 'quantity'];

       if (config.aggregation === 'Sum' && numericFields.includes(mapKey)) {
           value = filteredOrders?.reduce((acc, o) => acc + (parseFloat(o[mapKey]) || 0), 0);
       } else if (config.aggregation === 'Average' && numericFields.includes(mapKey)) {
           const sum = filteredOrders?.reduce((acc, o) => acc + (parseFloat(o[mapKey]) || 0), 0);
           value = filteredOrders?.length ? sum / filteredOrders?.length : 0;
       } else {
           value = filteredOrders?.length;
       }
       
       return (
         <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-gradient-to-t from-white/5 to-transparent rounded-[2rem]">
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/30 mb-3">{config.aggregation || 'Count'} OF {metric}</span>
            <span className="text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
              {config.dataFormat === 'Currency' ? '$' : ''}{Number(value).toLocaleString(undefined, { minimumFractionDigits: config.decimalPrecision, maximumFractionDigits: config.decimalPrecision })}
            </span>
         </div>
       );
    }

    if (['Bar Chart', 'Line Chart', 'Area Chart', 'Scatter Plot'].includes(type)) {
        const xMap = { 'Product': 'product', 'Quantity': 'quantity', 'Unit price': 'unitPrice', 'Total amount': 'totalAmount', 'Status': 'status', 'Created by': 'createdBy', 'Duration': 'duration' };
        const xAxisField = xMap[config.xAxis] || 'product';
        const yAxisField = xMap[config.yAxis] || 'totalAmount';
        const getFieldVal = (o, f) => {
            if (f === 'duration') return Math.max(0, Math.floor((new Date() - new Date(o.orderDate)) / 86400000));
            return o[f];
        };
        const color = config.color || '#F97316';
        
        let chartData = [];
        if (type === 'Scatter Plot') {
             chartData = filteredOrders?.map(o => ({ x: parseFloat(getFieldVal(o, xAxisField)) || 0, y: parseFloat(getFieldVal(o, yAxisField)) || 0, name: getFieldVal(o, xAxisField) }));
        } else {
            const agg = {};
            filteredOrders?.forEach(o => {
                const xVal = getFieldVal(o, xAxisField) || 'N/A';
                agg[xVal] = (agg[xVal] || 0) + (parseFloat(getFieldVal(o, yAxisField)) || 0);
            });
            chartData = Object.keys(agg).map(k => ({ name: k, value: agg[k] }));
        }

        return (
            <ResponsiveContainer width="100%" height="100%">
                {type === 'Bar Chart' ? (
                  <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                     <XAxis dataKey="name" tick={{fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontWeight: 600}} axisLine={false} tickLine={false} />
                     <YAxis tick={{fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontWeight: 600}} axisLine={false} tickLine={false} />
                     <RechartsTooltip contentStyle={{ backgroundColor: '#1a1d23', borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', color: '#fff' }} />
                     <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
                  </BarChart>
                ) : type === 'Line Chart' ? (
                  <LineChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                     <XAxis dataKey="name" tick={{fontSize: 9, fill: 'rgba(255,255,255,0.4)'}} axisLine={false} tickLine={false} />
                     <YAxis tick={{fontSize: 9, fill: 'rgba(255,255,255,0.4)'}} axisLine={false} tickLine={false} />
                     <RechartsTooltip />
                     <Line type="smooth" dataKey="value" stroke={color} strokeWidth={4} dot={{ r: 5, fill: color, strokeWidth: 3, stroke: '#1a1d23' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                  </LineChart>
                ) : type === 'Area Chart' ? (
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                     <defs><linearGradient id={`grad_${widget.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={0.4}/><stop offset="95%" stopColor={color} stopOpacity={0}/></linearGradient></defs>
                     <XAxis dataKey="name" hide />
                     <RechartsTooltip />
                     <Area type="monotone" dataKey="value" stroke={color} strokeWidth={3} fillOpacity={1} fill={`url(#grad_${widget.id})`} />
                  </AreaChart>
                ) : (
                  <ScatterChart margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                     <XAxis dataKey="x" tick={{fontSize: 10, fill: 'rgba(255,255,255,0.4)'}} name={config.xAxis} axisLine={false} />
                     <YAxis dataKey="y" tick={{fontSize: 10, fill: 'rgba(255,255,255,0.4)'}} name={config.yAxis} axisLine={false} />
                     <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                     <Scatter data={chartData} fill={color} shape="circle" />
                  </ScatterChart>
                )}
            </ResponsiveContainer>
        );
    }

    if (type === 'Pie Chart') {
        const fieldMap = { 'Product': 'product', 'Quantity': 'quantity', 'Unit price': 'unitPrice', 'Total amount': 'totalAmount', 'Status': 'status', 'Created by': 'createdBy' };
        const pieData = Object.entries(filteredOrders?.reduce((acc, o) => { const k = o[fieldMap[config.chartData] || 'status'] || 'Unknown'; acc[k] = (acc[k] || 0) + 1; return acc; }, {}) || {}).map(([name, value]) => ({ name, value }));
        const COLORS = ['#F97316', '#8B5CF6', '#3B82F6', '#10B981', '#F43F5E', '#EC4899'];

        return (
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={pieData} cx="50%" cy="45%" innerRadius="60%" outerRadius="85%" dataKey="value" stroke="none" paddingAngle={5}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} cornerRadius={4} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: '#1a1d23', borderRadius: '12px', border: 'none' }} />
                    {config.showLegend && <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '15px'}} />}
                </PieChart>
            </ResponsiveContainer>
        );
    }

    if (type === 'Table') {
        const colMap = { 'Customer ID': 'id', 'Customer name': 'firstName', 'Email id': 'email', 'Phone number': 'phone', 'Address': 'city', 'Order ID': 'id', 'Order date': 'orderDate', 'Product': 'product', 'Quantity': 'quantity', 'Unit price': 'unitPrice', 'Total amount': 'totalAmount', 'Status': 'status', 'Created by': 'createdBy' };
        const displayCols = (config.columns || []).map(c => ({ header: c, key: colMap[c] || 'id' }));
        let data = [...(filteredOrders || [])];
        if (config.applyFilter && config.filterValue) {
            const fv = config.filterValue.toLowerCase();
            data = data.filter(o => displayCols.some(c => (o[c.key] || '').toString().toLowerCase().includes(fv)));
        }
        if (config.sortBy === 'Order date') data.sort((a,b) => new Date(b.orderDate) - new Date(a.orderDate));
        const pageData = data.slice(0, config.pagination || 5);

        return (
            <div className="h-full overflow-auto text-white/90" style={{ fontSize: `${config.fontSize || 13}px` }}>
               <table className="w-full text-left border-separate border-spacing-y-2">
                 <thead className="sticky top-0 z-20">
                   <tr className="uppercase text-[10px] tracking-[0.2em] text-white/30 font-black">
                     {displayCols.map(c => <th key={c.header} className="px-4 py-2 border-none" style={{ background: config.headerBackground || 'transparent', color: config.headerBackground ? '#fff' : 'inherit' }}>{c.header}</th>)}
                   </tr>
                 </thead>
                 <tbody>
                   {pageData.map((o, idx) => (
                       <tr key={idx} className="bg-white/5 hover:bg-white/10 transition-all rounded-xl group/tr overflow-hidden">
                         {displayCols.map(c => {
                             let val = o[c.key];
                             if (c.header === 'Customer name') val = `${o.firstName} ${o.lastName}`;
                             if (c.key === 'orderDate') val = new Date(val).toLocaleDateString();
                             if (['unitPrice', 'totalAmount'].includes(c.key)) val = `$${parseFloat(val||0).toFixed(2)}`;
                             return <td key={c.header} className="px-4 py-3 whitespace-nowrap first:rounded-l-2xl last:rounded-r-2xl border-none">
                               {c.key === 'status' ? <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${val === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : val === 'In Progress' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>{val}</span> : val}
                             </td>;
                         })}
                       </tr>
                   ))}
                 </tbody>
               </table>
            </div>
        );
    }
    return null;
  };

  // Order Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openModal = (order = null) => {
    if (order) {
      setFormData({ ...order, unitPrice: order.unitPrice.toString() });
      setEditingId(order.id);
    } else {
      setFormData({
        firstName: '', lastName: '', email: '', phone: '',
        streetAddress: '', city: '', state: '', postalCode: '', country: '',
        product: '', quantity: 1, unitPrice: '', status: 'Pending', createdBy: ''
      });
      setEditingId(null);
    }
    setFormErrors({});
    setSubmitError('');
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    const mandatory = ['firstName', 'lastName', 'email', 'phone', 'streetAddress', 'city', 'state', 'postalCode', 'country', 'product', 'quantity', 'unitPrice', 'status', 'createdBy'];
    mandatory.forEach(f => {
      if (!formData[f] || formData[f].toString().trim() === '') {
        errors[f] = 'Please fill the field';
      }
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const qty = parseInt(formData.quantity) || 1;
      const price = parseFloat(formData.unitPrice) || 0;
      const payload = {
        ...formData,
        quantity: qty,
        unitPrice: price,
        totalAmount: qty * price
      };
      if (editingId) {
        await updateOrder(editingId, payload);
      } else {
        await createOrder(payload);
      }
      setIsModalOpen(false);
      fetchOrders();
    } catch (error) {
      console.error('Order submit error:', error);
      const msg = error?.response?.data?.detail || 'Failed to save order. Please check all fields.';
      setSubmitError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Terminate this operational record?')) {
      try {
        await deleteOrder(id);
        await fetchOrders(); // Force refresh
        setActiveMenuId(null);
        // Optionally show a toast or alert if possible, but the list refreshing is the key feedback
      } catch (error) { 
        console.error('Delete failed:', error); 
        alert('Failed to delete record. Please try again.');
      }
    }
  };

  const ContextMenu = ({ order }) => (
    <div className="absolute right-0 mt-2 w-48 bg-[#1a1d23] border border-white/10 rounded-2xl shadow-2xl z-[500] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      <button 
        onClick={(e) => { e.stopPropagation(); openModal(order); setActiveMenuId(null); }}
        className="w-full px-6 py-4 text-left text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors text-xs font-black uppercase tracking-widest border-b border-white/5"
      >
        <span className="text-blue-400">📝</span> Edit Record
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); handleDelete(order.id); setActiveMenuId(null); }}
        className="w-full px-6 py-4 text-left text-red-500 hover:bg-red-500/10 flex items-center gap-3 transition-colors text-xs font-black uppercase tracking-widest"
      >
        <span className="text-red-500">🗑️</span> Terminate
      </button>
    </div>
  );

  return (
    <div className="min-h-screen relative flex flex-col pt-20 overflow-hidden font-['Outfit'] transition-all duration-700 bg-[#0d0f1a] selection:bg-orange-500/30">
      
      {/* â”€â”€ MODERN GRADIENT & BLOB BACKGROUND â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Main Deep Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d0f1a] via-[#161827] to-[#0d0f1a]" />
        
        {/* Animated Modern SaaS Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-purple-600/10 rounded-full blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute top-[30%] left-[20%] w-[50%] h-[50%] bg-cyan-500/5 rounded-full blur-[120px] animate-blob animation-delay-4000" />
        
        {/* Sub-Blobs for color accents */}
        <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] bg-lightpink-500/5 rounded-full blur-[100px] animate-blob" />
        
        {/* Mesh Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 30h1v1h-1z' fill='%23ffffff' fill-opacity='0.4'/%3E%3C/svg%3E")` }} />
      </div>

      <div className="fixed inset-0 z-1 backdrop-blur-[1px] bg-black/20 pointer-events-none" />

      {/* â”€â”€ GLOSSY HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <header className="fixed top-0 inset-x-0 min-h-[6rem] py-4 md:py-0 md:h-24 bg-black/40 backdrop-blur-3xl border-b border-white/5 z-[100] transition-all duration-500">
        <div className="max-w-[1700px] mx-auto h-full px-4 md:px-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-5 group">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-all duration-500 scale-100 group-hover:scale-110">
              <span className="text-black font-black text-2xl">H</span>
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter leading-none">Admin <span className="text-orange-500">Hub</span></h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Operational: Active</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-6">
             {/* ðŸ“… DATE FILTER */}
             <div className="relative group">
                <select 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl border border-white/10 outline-none transition-all cursor-pointer appearance-none pr-12 focus:border-orange-500/50"
                >
                  <option value="All time" className="bg-[#1a1d23]">All time</option>
                  <option value="Today" className="bg-[#1a1d23]">Today</option>
                  <option value="Last 7 Days" className="bg-[#1a1d23]">Last 7 Days</option>
                  <option value="Last 30 Days" className="bg-[#1a1d23]">Last 30 Days</option>
                  <option value="Last 90 Days" className="bg-[#1a1d23]">Last 90 Days</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 group-hover:text-orange-500 transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7" /></svg>
                </div>
             </div>

             <div className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Cycle Refined</span>
                <span className="text-orange-500 font-mono font-bold leading-none">{refreshCountdown}s</span>
             </div>
             
             <button onClick={() => navigate('/dashboard')} className="px-8 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest rounded-2xl border border-white/10 transition-all transform hover:-translate-y-1 active:scale-95">
                Dashboard
             </button>

             <button onClick={() => navigate('/dashboard/configure')} className="px-8 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-[0_10px_30px_rgba(249,115,22,0.3)] transition-all transform hover:-translate-y-1 active:scale-95">
                Configure Hub
             </button>

             <button 
                onClick={() => {
                  localStorage.removeItem('auth_token');
                  localStorage.removeItem('user');
                  navigate('/login');
                }}
                className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest rounded-2xl border border-red-500/20 transition-all active:scale-95"
             >
                Logout
             </button>
          </div>
        </div>
      </header>

      {/* â”€â”€ MAIN CONTENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <main className="relative z-10 w-full max-w-[1750px] mx-auto px-4 md:px-10 py-12 md:pb-32 mt-20 md:mt-0">
          
          {/* ── HEADER INTRO ───────────────────────────────── */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-20 animate-slide-up mt-10 md:mt-0">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                 <span className="bg-orange-500/10 text-orange-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-500/20">Operational Intel</span>
                 <div className="w-px h-4 bg-white/10 mx-1" />
                 <span className="text-white/20 text-[10px] font-black uppercase tracking-widest italic">{stats.topProduct} Dominance</span>
              </div>
              <h2 className="text-[3rem] md:text-[5.5rem] font-black text-white tracking-tighter mb-6 leading-[0.9] drop-shadow-2xl">System<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-600">Analytics</span></h2>
              <p className="text-white/40 font-medium text-lg md:text-xl leading-relaxed max-w-xl">Harnessing advanced operational data streams to drive strategic excellence and real-time decision clarity.</p>
            </div>
          </div>

          {/* â”€â”€â”€â”€â”€â”€ KPI GRID (SaaS MODERNISED) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {[
              { label: 'Network Volume', value: stats.total, icon: 'ðŸ“Š', color: 'from-blue-500 to-indigo-600', trend: '+12% from yesterday' },
              { label: 'Accumulated Capital', value: `$${stats.revenue.toLocaleString(undefined, {maximumFractionDigits: 0})}`, icon: 'ðŸ’Ž', color: 'from-purple-500 to-pink-600', trend: 'Peak Performance' },
              { label: 'Active Pipeline', value: stats.pending, icon: 'âš¡', color: 'from-orange-500 to-amber-600', trend: 'Stability Optimized' },
              { label: 'Verified Delivery', value: stats.completed, icon: 'ðŸ”®', color: 'from-emerald-500 to-teal-600', trend: '98% Efficiency' }
            ].map((k, i) => (
              <div key={i} className="glass-card smooth-hover p-10 rounded-[3rem] group cursor-pointer relative overflow-hidden transition-all duration-500">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${k.color} opacity-[0.03] rounded-full -mr-16 -mt-16 transition-all duration-700 group-hover:scale-150 group-hover:opacity-[0.08]`} />
                <div className="flex items-center justify-between mb-10">
                  <div className={`w-16 h-16 rounded-[1.5rem] bg-gradient-to-br ${k.color} flex items-center justify-center text-3xl shadow-xl transform group-hover:rotate-12 transition-all`}>
                    {k.icon}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">{k.label}</span>
                    <div className="text-[9px] font-black text-emerald-500 mt-1 uppercase tracking-widest">{k.trend}</div>
                  </div>
                </div>
                <div className="text-6xl font-black text-white tracking-tighter group-hover:scale-105 transition-all">
                  {k.value}
                </div>
              </div>
            ))}
          </div>

        {/* â”€â”€ DYNAMIC CANVAS ENGINE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="relative animate-slide-up" style={{ animationDelay: '0.6s' }}>
          {dashboardConfig?.widgets?.length > 0 ? (
            <ResponsiveGridLayout
              className="layout"
              layouts={dashboardConfig.layouts || { lg: [] }}
              breakpoints={{ lg: 1200, md: 1024, sm: 768, xs: 480 }}
              cols={{ lg: 12, md: 8, sm: 4, xs: 4 }}
              rowHeight={60}
              margin={[20, 20]}
              isDraggable={false}
              isResizable={false}
            >
              {dashboardConfig.widgets.map(w => {
                 const l = dashboardConfig.layouts?.lg?.find(layer => layer.i === w.id) || {};
                 return (
                   <div key={w.id} data-grid={{ x: l.x ?? 0, y: l.y ?? 0, w: w.config?.w ?? w.w ?? 4, h: w.config?.h ?? w.h ?? 4 }} className="bg-white/5 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-white/5 hover:border-white/20 transition-all duration-700 overflow-hidden flex flex-col group/widget hover:-translate-y-2 ring-1 ring-white/5">
                      <div className="flex items-center justify-between px-10 py-7 flex-shrink-0">
                         <div className="flex items-center gap-3">
                           <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" style={{ backgroundColor: '#F97316' }} />
                           <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">{w.config?.title || w.type}</h3>
                         </div>
                         <div className="text-[9px] font-black text-white/10 uppercase tracking-widest">{w.id.split('_').pop()}</div>
                      </div>
                      <div className="flex-1 min-h-0 relative p-10 pt-0">
                         {renderWidget(w)}
                      </div>
                   </div>
                 );
              })}
            </ResponsiveGridLayout>
          ) : (
            <div className="bg-white/5 backdrop-blur-3xl rounded-[4rem] border border-white/5 p-32 text-center shadow-2xl shadow-orange-500/5 flex flex-col items-center border border-white/5 ring-1 ring-white/10" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
               <div className="w-32 h-32 bg-orange-500/10 rounded-full flex items-center justify-center text-6xl mb-10 float-element border border-orange-500/20 shadow-[0_0_40px_rgba(249,115,22,0.1)]">ðŸŽ¨</div>
               <h3 className="text-5xl font-black text-white tracking-tighter mb-6">Empty Creative Canvas</h3>
               <p className="text-white/30 font-bold text-xl mb-12 max-w-lg mx-auto leading-relaxed uppercase tracking-widest">Connect your operational data streams to begin visualizing the intelligence hub.</p>
               <button onClick={() => navigate('/dashboard-config')} className="px-14 py-6 bg-orange-500 hover:bg-orange-600 text-white rounded-3xl font-black text-lg shadow-2xl shadow-orange-500/40 transition-all hover:-translate-y-2 hover:scale-105 active:scale-95">Design Workspace</button>
            </div>
          )}
        </div>

        {/* â”€â”€ CUSTOMER ORDER SECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="mt-40 animate-slide-up" style={{ animationDelay: '0.8s' }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 px-4 gap-4">
             <div>
                <p className="text-orange-500 font-black uppercase text-[10px] tracking-[0.4em] mb-4">Operations Management</p>
                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight">Customer Order <br/><span className="text-white/20">Section</span></h2>
             </div>
             <button 
               onClick={() => openModal()}
               className="bg-orange-500 hover:bg-orange-600 text-white font-black py-5 px-10 rounded-[2.5rem] shadow-2xl shadow-orange-500/40 transition-all hover:-translate-y-2 active:scale-95 flex items-center gap-4 group"
             >
               <span className="text-xl group-hover:rotate-12 transition-transform">âž•</span> Create Order
             </button>
          </div>

          <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl ring-1 ring-white/5">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="p-8 text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">Contact</th>
                  <th className="p-8 text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">Asset Type</th>
                  <th className="p-8 text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">Units</th>
                  <th className="p-8 text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">Total Value</th>
                  <th className="p-8 text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">Status</th>
                  <th className="p-8 text-[11px] font-black text-white/30 uppercase tracking-[0.2em] text-right">Protocol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-20 text-center text-white/10 font-black uppercase tracking-widest">No Active Records</td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-8">
                         <div className="flex flex-col">
                            <span className="text-white font-black tracking-tight">{order.firstName} {order.lastName}</span>
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-tighter">{order.email}</span>
                         </div>
                      </td>
                      <td className="p-8 text-white/60 font-bold text-sm">{order.product}</td>
                      <td className="p-8 text-orange-500 font-black text-lg">{order.quantity}</td>
                      <td className="p-8">
                         <div className="flex flex-col">
                            <span className="text-white font-black">${parseFloat(order.totalAmount || 0).toFixed(2)}</span>
                         </div>
                      </td>
                      <td className="p-8">
                        <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full 
                          ${order.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-8 text-right relative">
                         <button 
                            onClick={(e) => {
                               e.stopPropagation();
                               setActiveMenuId(activeMenuId === order.id ? null : order.id);
                            }}
                            className="w-10 h-10 bg-white/5 hover:bg-white/10 text-white rounded-xl flex items-center justify-center border border-white/5 transition-all active:scale-95"
                         >
                            <svg className="w-5 h-5 text-white/40" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
                            </svg>
                         </button>
                         {activeMenuId === order.id && <ContextMenu order={order} />}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* â”€â”€ UNIQUE FEATURE: INTELLIGENCE BUBBLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="fixed bottom-10 right-10 z-[200] group">
         <div className="absolute inset-0 bg-orange-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity animate-pulse" />
         <button className="relative w-20 h-20 bg-orange-500 text-white rounded-full flex items-center justify-center text-3xl shadow-[0_15px_40px_rgba(249,115,22,0.4)] hover:scale-110 active:scale-90 transition-all duration-300">
            <span>🧠</span>
            <div className="absolute right-full mr-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
               <div className="bg-black/80 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-2xl whitespace-nowrap shadow-2xl">
                 <div className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">AI Assistant</div>
                 <div className="text-white font-black text-sm uppercase">"Revenue trend is looking healthy today!"</div>
               </div>
            </div>
         </button>
      </div>

      {/* â”€â”€ EXTRA FEATURE: MARKET TICKER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="fixed bottom-0 inset-x-0 h-10 bg-black/80 backdrop-blur-3xl border-t border-white/5 z-[150] flex items-center overflow-hidden">
         <div className="flex gap-12 animate-[ticker_60s_linear_infinite] whitespace-nowrap px-10">
            {['REVENUE: +14% ðŸ“ˆ', 'LATENCY: 12ms âœ…', 'ORDERS: 1,420 ðŸ“¦', 'STOCK: OPTIMAL ðŸ”‹', 'UPTIME: 99.9% âš¡', 'ACTIVE USERS: 420 ðŸ‘¥'].map((t, i) => (
              <span key={i} className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">
                 <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                 {t}
              </span>
            )).concat(
              ['REVENUE: +14% ðŸ“ˆ', 'LATENCY: 12ms âœ…', 'ORDERS: 1,420 ðŸ“¦', 'STOCK: OPTIMAL ðŸ”‹', 'UPTIME: 99.9% âš¡', 'ACTIVE USERS: 420 ðŸ‘¥'].map((t, i) => (
                <span key={`dup-${i}`} className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                   {t}
                </span>
              ))
            )}
         </div>
      </div>
      
      {/* â”€â”€ CREATE ORDER POPUP FORM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-[#0d0f1a] w-full max-w-4xl rounded-[4rem] shadow-2xl border border-white/10 overflow-hidden animate-slide-up p-16">
             <div className="mb-12 text-center">
                <p className="text-orange-500 font-black uppercase text-[10px] tracking-[0.4em] mb-4">Strategic Entry</p>
                <h2 className="text-4xl font-black text-white tracking-tighter">{editingId ? 'Modify Strategy' : 'New Strategic Record'}</h2>
             </div>
             <form onSubmit={handleOrderSubmit} className="space-y-8 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                {/* â”€â”€ SECTION 01: IDENTITY â”€â”€ */}
                <div>
                   <div className="flex items-center gap-4 mb-8">
                      <span className="text-orange-500 font-black text-xs">01</span>
                      <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Identity Authentication</h3>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-4">Given Name</label>
                         <input name="firstName" value={formData.firstName} onChange={handleInputChange} className={`bg-white/5 border ${formErrors.firstName ? 'border-red-500' : 'border-white/5'} p-5 rounded-2xl text-white font-bold outline-none focus:border-orange-500/50 transition-all`} />
                         {formErrors.firstName && <span className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-4">{formErrors.firstName}</span>}
                      </div>
                      <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-4">Family Name</label>
                         <input name="lastName" value={formData.lastName} onChange={handleInputChange} className={`bg-white/5 border ${formErrors.lastName ? 'border-red-500' : 'border-white/5'} p-5 rounded-2xl text-white font-bold outline-none focus:border-orange-500/50 transition-all`} />
                         {formErrors.lastName && <span className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-4">{formErrors.lastName}</span>}
                      </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                      <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-4">Signal Link (Email)</label>
                         <input name="email" value={formData.email} onChange={handleInputChange} className={`bg-white/5 border ${formErrors.email ? 'border-red-500' : 'border-white/5'} p-5 rounded-2xl text-white font-bold outline-none focus:border-orange-500/50 transition-all`} />
                         {formErrors.email && <span className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-4">{formErrors.email}</span>}
                      </div>
                      <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-4">Primary Contact (Phone)</label>
                         <input name="phone" value={formData.phone} onChange={handleInputChange} className={`bg-white/5 border ${formErrors.phone ? 'border-red-500' : 'border-white/5'} p-5 rounded-2xl text-white font-bold outline-none focus:border-orange-500/50 transition-all`} />
                         {formErrors.phone && <span className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-4">{formErrors.phone}</span>}
                      </div>
                   </div>
                </div>

                {/* â”€â”€ SECTION 02: GEOGRAPHY â”€â”€ */}
                <div>
                   <div className="flex items-center gap-4 mb-8 pt-8 border-t border-white/5">
                      <span className="text-orange-500 font-black text-xs">02</span>
                      <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Geographic Deployment</h3>
                   </div>
                   <div className="grid grid-cols-1 gap-8">
                      <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-4">Street Address</label>
                         <input name="streetAddress" value={formData.streetAddress} onChange={handleInputChange} className={`bg-white/5 border ${formErrors.streetAddress ? 'border-red-500' : 'border-white/5'} p-5 rounded-2xl text-white font-bold outline-none focus:border-orange-500/50 transition-all`} />
                         {formErrors.streetAddress && <span className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-4">{formErrors.streetAddress}</span>}
                      </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                      <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-4">City</label>
                         <input name="city" value={formData.city} onChange={handleInputChange} className={`bg-white/5 border ${formErrors.city ? 'border-red-500' : 'border-white/5'} p-5 rounded-2xl text-white font-bold outline-none focus:border-orange-500/50 transition-all`} />
                         {formErrors.city && <span className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-4">{formErrors.city}</span>}
                      </div>
                      <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-4">State/Province</label>
                         <input name="state" value={formData.state} onChange={handleInputChange} className={`bg-white/5 border ${formErrors.state ? 'border-red-500' : 'border-white/5'} p-5 rounded-2xl text-white font-bold outline-none focus:border-orange-500/50 transition-all`} />
                         {formErrors.state && <span className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-4">{formErrors.state}</span>}
                      </div>
                      <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-4">Postal Code</label>
                         <input name="postalCode" value={formData.postalCode} onChange={handleInputChange} className={`bg-white/5 border ${formErrors.postalCode ? 'border-red-500' : 'border-white/5'} p-5 rounded-2xl text-white font-bold outline-none focus:border-orange-500/50 transition-all`} />
                         {formErrors.postalCode && <span className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-4">{formErrors.postalCode}</span>}
                      </div>
                   </div>
                   <div className="flex flex-col gap-2 mt-8">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-4">Country</label>
                      <select name="country" value={formData.country} onChange={handleInputChange} className={`bg-white/5 border ${formErrors.country ? 'border-red-500' : 'border-white/5'} p-5 rounded-2xl text-white font-bold outline-none focus:border-orange-500/50 transition-all appearance-none`}>
                         <option value="" className="bg-[#1a1d23]">Select Country...</option>
                         {['United States', 'Canada', 'Australia', 'Singapore', 'Hong Kong'].map(c => (
                            <option key={c} value={c} className="bg-[#1a1d23]">{c}</option>
                         ))}
                      </select>
                      {formErrors.country && <span className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-4">{formErrors.country}</span>}
                   </div>
                </div>

                {/* â”€â”€ SECTION 03: ASSETS â”€â”€ */}
                <div>
                   <div className="flex items-center gap-4 mb-8 pt-8 border-t border-white/5">
                      <span className="text-orange-500 font-black text-xs">03</span>
                      <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Tactical Parameters</h3>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-4">Tactical Asset</label>
                         <select name="product" value={formData.product} onChange={handleInputChange} className={`bg-white/5 border ${formErrors.product ? 'border-red-500' : 'border-white/5'} p-5 rounded-2xl text-white font-bold outline-none focus:border-orange-500/50 transition-all appearance-none`}>
                            <option value="" className="bg-[#1a1d23]">Select Asset...</option>
                            {['Fiber Internet 300 Mbps', '5G Unlimited Mobile Plan', 'Fiber Internet 1 Gbps', 'Business Internet 500 Mbps', 'VoIP Corporate Package'].map(p => (
                               <option key={p} value={p} className="bg-[#1a1d23]">{p}</option>
                            ))}
                         </select>
                         {formErrors.product && <span className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-4">{formErrors.product}</span>}
                      </div>
                      <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-4">Operational Status</label>
                         <select name="status" value={formData.status} onChange={handleInputChange} className={`bg-white/5 border ${formErrors.status ? 'border-red-500' : 'border-white/5'} p-5 rounded-2xl text-white font-bold outline-none focus:border-orange-500/50 transition-all appearance-none`}>
                            {['Pending', 'In Progress', 'Completed', 'Cancelled'].map(s => (
                               <option key={s} value={s} className="bg-[#1a1d23]">{s}</option>
                            ))}
                         </select>
                         {formErrors.status && <span className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-4">{formErrors.status}</span>}
                      </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                      <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-4">Payload Volume (Qty)</label>
                         <input type="number" name="quantity" min="1" value={formData.quantity} onChange={handleInputChange} className={`bg-white/5 border ${formErrors.quantity ? 'border-red-500' : 'border-white/5'} p-5 rounded-2xl text-white font-bold outline-none focus:border-orange-500/50 transition-all`} />
                         {formErrors.quantity && <span className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-4">{formErrors.quantity}</span>}
                      </div>
                      <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-4">Asset Value (Unit Price)</label>
                         <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 font-bold">$</span>
                            <input name="unitPrice" value={formData.unitPrice} onChange={handleInputChange} className={`w-full bg-white/5 border ${formErrors.unitPrice ? 'border-red-500' : 'border-white/5'} p-5 pl-10 rounded-2xl text-white font-bold outline-none focus:border-orange-500/50 transition-all`} placeholder="0.00" />
                         </div>
                         {formErrors.unitPrice && <span className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-4">{formErrors.unitPrice}</span>}
                      </div>
                   </div>
                   <div className="flex flex-col gap-2 mt-8">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-4">Strategic Authority (Created By)</label>
                      <select name="createdBy" value={formData.createdBy} onChange={handleInputChange} className={`bg-white/5 border ${formErrors.createdBy ? 'border-red-500' : 'border-white/5'} p-5 rounded-2xl text-white font-bold outline-none focus:border-orange-500/50 transition-all appearance-none`}>
                         <option value="" className="bg-[#1a1d23]">Select Authority...</option>
                         {['Mr. Michael Harris', 'Mr. Ryan Cooper', 'Ms. Olivia Carter', 'Mr. Lucas Martin'].map(a => (
                            <option key={a} value={a} className="bg-[#1a1d23]">{a}</option>
                         ))}
                      </select>
                      {formErrors.createdBy && <span className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-4">{formErrors.createdBy}</span>}
                   </div>
                   <div className="flex flex-col gap-2 mt-8 bg-orange-500/5 p-6 rounded-3xl border border-orange-500/10">
                      <label className="text-[10px] font-black text-orange-500/40 uppercase tracking-widest ml-1">Accumulated Valuation</label>
                      <div className="text-3xl font-black text-orange-500 tracking-tighter">
                         ${(parseFloat(formData.quantity) * parseFloat(formData.unitPrice || 0) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                   </div>
                </div>

                {Object.keys(formErrors).length > 0 && (
                   <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-2xl px-6 py-4 text-red-400 text-xs font-bold animate-pulse">
                     ⚠️ {Object.keys(formErrors).length} required fields are missing in upper sections.
                   </div>
                )}

                {submitError && (
                   <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-2xl px-6 py-4 text-red-200 text-xs font-bold bg-red-600/20">
                     🚨 API ERROR: {submitError}
                   </div>
                )}

                 <div className="flex justify-end gap-6 pt-8 border-t border-white/5 sticky bottom-0 bg-[#0d0f1a] pb-4">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-5 text-[11px] font-black text-white/20 hover:text-white uppercase tracking-widest transition-all">Abort mission</button>
                   <button type="submit" disabled={isSubmitting} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-5 px-12 rounded-[2rem] shadow-2xl shadow-orange-500/40 transition-all transform hover:-translate-y-1 active:scale-95">
                      {isSubmitting ? 'SYNCHRONIZING...' : (editingId ? 'COMMIT MODIFICATION' : 'AUTHORIZE DEPLOYMENT')}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(249, 115, 22, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(249, 115, 22, 0.5);
        }
      `}</style>

    </div>
  );
};

export default AdminDashboard;


