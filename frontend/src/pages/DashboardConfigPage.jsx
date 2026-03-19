import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ScatterChart, Scatter, Legend
} from 'recharts';
import { getDashboardWidgets, saveDashboardConfig, getOrders } from '../services/api';
import WidgetConfigPanel from '../components/WidgetConfigPanel';

const ResponsiveGridLayout = WidthProvider(Responsive);

// ─── Widget Catalogue ──────────────────────────────────────────────────────────
const WIDGET_CATALOGUE = [
  { group: 'Charts', type: 'Bar Chart',    icon: '📊', color: 'bg-blue-100 text-blue-600',     defaultW: 5, defaultH: 5, minW: 1, minH: 1 },
  { group: 'Charts', type: 'Line Chart',   icon: '📈', color: 'bg-blue-100 text-blue-600',     defaultW: 5, defaultH: 5, minW: 1, minH: 1 },
  { group: 'Charts', type: 'Pie Chart',    icon: '🥧', color: 'bg-blue-100 text-blue-600',     defaultW: 4, defaultH: 4, minW: 1, minH: 1 },
  { group: 'Charts', type: 'Area Chart',   icon: '📉', color: 'bg-blue-100 text-blue-600',     defaultW: 5, defaultH: 5, minW: 1, minH: 1 },
  { group: 'Charts', type: 'Scatter Plot', icon: '🔵', color: 'bg-blue-100 text-blue-600',     defaultW: 5, defaultH: 5, minW: 1, minH: 1 },
  { group: 'Tables', type: 'Table',        icon: '📋', color: 'bg-green-100 text-green-600',   defaultW: 4, defaultH: 4, minW: 1, minH: 1 },
  { group: 'KPIs',   type: 'KPI Value',    icon: '🔢', color: 'bg-purple-100 text-purple-600', defaultW: 2, defaultH: 2, minW: 1, minH: 1 },
];

const GROUP_META = {
  Charts: { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-100',   icon: '📊', iconBg: 'bg-blue-100'   },
  Tables: { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-100',  icon: '📋', iconBg: 'bg-green-100'  },
  KPIs:   { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100', icon: '🔢', iconBg: 'bg-purple-100' },
};

const PIE_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

const getDefaultConfig = (type) => {
  if (type === 'KPI Value')
    return { metric: 'Total amount', aggregation: 'Sum', format: 'Currency', precision: 0 };
  if (['Bar Chart', 'Line Chart', 'Area Chart', 'Scatter Plot'].includes(type))
    return { xAxis: 'Product', yAxis: 'Total amount', color: '#3b82f6', showLabel: true };
  if (type === 'Pie Chart')
    return { dataField: 'Status', showLegend: true };
  if (type === 'Table')
    return { columns: ['Customer name', 'Product', 'Total amount', 'Status'], fontSize: 14, headerBg: '#54bd95', rowsPerPage: 10 };
  return {};
};

// ─── Field map (declared first — used by aggregate and getField) ───────────────
const fieldMap = {
  'Customer name':  null,           // handled specially in getField
  'Customer ID':    'id',
  'Email id':       'email',
  'Phone number':   'phone',
  'Address':        'streetAddress',
  'Order ID':       'id',
  'Order date':     'orderDate',
  'Product':        'product',
  'Quantity':       'quantity',
  'Unit price':     'unitPrice',
  'Total amount':   'totalAmount',
  'Status':         'status',
  'Created by':     'createdBy',
  'Duration':       'orderDate',
};

// Returns display value for a column label from an order object
const getField = (order, label) => {
  if (label === 'Customer name') {
    const first = order.firstName || order.first_name || '';
    const last  = order.lastName  || order.last_name  || '';
    return [first, last].filter(Boolean).join(' ') || order.customerName || '';
  }
  const key = fieldMap[label] ?? label.toLowerCase().replace(/ /g, '');
  return order[key] ?? order[label] ?? '';
};

// ─── Data computation helpers ─────────────────────────────────────────────────
const aggregate = (orders, field, fn) => {
  if (fn === 'Count') return orders.length;
  const vals = orders.map(o => parseFloat(getField(o, field))).filter(v => !isNaN(v));
  if (!vals.length) return 0;
  if (fn === 'Sum')     return vals.reduce((a, b) => a + b, 0);
  if (fn === 'Average') return vals.reduce((a, b) => a + b, 0) / vals.length;
  if (fn === 'Min')     return Math.min(...vals);
  if (fn === 'Max')     return Math.max(...vals);
  return vals.reduce((a, b) => a + b, 0);
};

const groupBy = (orders, field) => {
  const map = {};
  orders.forEach(o => {
    const k = getField(o, field) || 'Unknown';
    map[k] = (map[k] || 0) + 1;
  });
  return Object.entries(map).map(([name, count]) => ({ name, count }));
};

const groupByXY = (orders, xField, yField) => {
  const map = {};
  orders.forEach(o => {
    const x = getField(o, xField) || 'Unknown';
    const y = parseFloat(getField(o, yField)) || 0;
    if (!map[x]) map[x] = 0;
    map[x] += y;
  });
  return Object.entries(map).slice(0, 8).map(([x, y]) => ({ x, y }));
};

// ─── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-sm font-bold
    ${type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}
    style={{ animation: 'slideUpToast 0.3s ease-out forwards' }}>
    <span>{type === 'error' ? '❌' : '✅'}</span>
    {message}
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">✕</button>
  </div>
);

// ─── Grip Icon ─────────────────────────────────────────────────────────────────
const GripIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="text-gray-400 flex-shrink-0">
    <circle cx="3" cy="3" r="1.5"/><circle cx="7" cy="3" r="1.5"/>
    <circle cx="3" cy="7" r="1.5"/><circle cx="7" cy="7" r="1.5"/>
    <circle cx="3" cy="11" r="1.5"/><circle cx="7" cy="11" r="1.5"/>
  </svg>
);

// ─── Sidebar Widget Item ───────────────────────────────────────────────────────
const WidgetItem = ({ item, onAdd }) => {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('widgetType', item.type);
    e.dataTransfer.effectAllowed = 'copy';
  };
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onAdd(item.type)}
      title={`Click or drag to add ${item.type}`}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent
        hover:border-gray-200 hover:bg-gray-50 cursor-grab active:cursor-grabbing
        transition-all duration-150 group select-none"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${item.color}`}>
        {item.icon}
      </div>
      <span className="text-xs font-semibold text-gray-700 group-hover:text-gray-900 flex-1 transition-colors">
        {item.type}
      </span>
      <span className="opacity-30 group-hover:opacity-70 transition-opacity">
        <GripIcon />
      </span>
    </div>
  );
};

// ─── Collapsible Sidebar Group ─────────────────────────────────────────────────
const SidebarGroup = ({ groupName, items, open, onToggle, onAddWidget }) => {
  const meta = GROUP_META[groupName];
  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-2.5 px-4 py-3 text-left border-b transition-colors ${meta.bg} ${meta.border} ${meta.text}`}
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-base ${meta.iconBg}`}>
          {meta.icon}
        </div>
        <span className="text-xs font-black uppercase tracking-[0.12em] flex-1">{groupName}</span>
        <span className={`text-xs transition-transform duration-300 opacity-60 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-[400px]' : 'max-h-0'}`}>
        <div className="p-2 space-y-0.5 bg-white">
          {items.map(item => <WidgetItem key={item.type} item={item} onAdd={onAddWidget} />)}
        </div>
      </div>
    </div>
  );
};

// ─── KPI Widget Preview ────────────────────────────────────────────────────────
const KPIPreview = ({ widget, orders }) => {
  const { metric = 'Total amount', aggregation = 'Sum', format = 'Number', precision = 0 } = widget.config || {};
  const val = useMemo(() => aggregate(orders, metric, aggregation), [orders, metric, aggregation]);
  const display = format === 'Currency'
    ? `$${val.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision })}`
    : val.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision });

  return (
    <div className="flex flex-col justify-between h-full p-4">
      <p className="text-xs text-gray-500 font-medium truncate">{metric}</p>
      <p className="text-2xl font-black text-gray-900 mt-1">{display}</p>
      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-1">{aggregation}</p>
    </div>
  );
};

// ─── Chart Preview ─────────────────────────────────────────────────────────────
const ChartPreview = ({ widget, orders }) => {
  const { type } = widget;
  const { xAxis = 'Product', yAxis = 'Total amount', color = '#3b82f6' } = widget.config || {};
  const data = useMemo(() => groupByXY(orders, xAxis, yAxis), [orders, xAxis, yAxis]);

  const chartProps = {
    data,
    margin: { top: 4, right: 8, left: -20, bottom: 0 },
  };
  const axisCls = { fontSize: 10, fill: '#94a3b8' };

  if (type === 'Bar Chart') return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart {...chartProps}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="x" tick={axisCls} axisLine={false} tickLine={false} />
        <YAxis tick={axisCls} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} />
        <Bar dataKey="y" fill={color} radius={[4, 4, 0, 0]} barSize={28} name={yAxis} />
      </BarChart>
    </ResponsiveContainer>
  );
  if (type === 'Line Chart') return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart {...chartProps}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="x" tick={axisCls} axisLine={false} tickLine={false} />
        <YAxis tick={axisCls} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} />
        <Line type="monotone" dataKey="y" stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color }} name={yAxis} />
      </LineChart>
    </ResponsiveContainer>
  );
  if (type === 'Area Chart') return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart {...chartProps}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.15} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="x" tick={axisCls} axisLine={false} tickLine={false} />
        <YAxis tick={axisCls} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} />
        <Area type="monotone" dataKey="y" stroke={color} strokeWidth={2.5} fill="url(#areaGrad)" name={yAxis} />
      </AreaChart>
    </ResponsiveContainer>
  );
  if (type === 'Scatter Plot') return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart {...chartProps}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="x" tick={axisCls} axisLine={false} tickLine={false} name={xAxis} />
        <YAxis dataKey="y" tick={axisCls} axisLine={false} tickLine={false} name={yAxis} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: 8, fontSize: 11 }} />
        <Scatter data={data} fill={color} />
      </ScatterChart>
    </ResponsiveContainer>
  );
  return null;
};

// ─── Pie Preview ───────────────────────────────────────────────────────────────
const PiePreview = ({ widget, orders }) => {
  const { dataField = 'Status', showLegend = true } = widget.config || {};
  const data = useMemo(() => groupBy(orders, dataField), [orders, dataField]);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius="65%" stroke="none">
          {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} />
        {showLegend && <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />}
      </PieChart>
    </ResponsiveContainer>
  );
};

// ─── Table Preview ─────────────────────────────────────────────────────────────
const TablePreview = ({ widget, orders }) => {
  const { columns = ['Customer name', 'Product', 'Total amount', 'Status'], headerBg = '#54bd95', fontSize = 14 } = widget.config || {};
  const rows = orders.slice(0, 15);
  return (
    <div className="w-full h-full overflow-auto">
      <table className="w-full text-left border-collapse" style={{ fontSize }}>
        <thead>
          <tr style={{ backgroundColor: headerBg }}>
            {columns.map(col => (
              <th key={col} className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((o, i) => (
            <tr key={o.id ?? i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
              {columns.map(col => (
                <td key={col} className="px-3 py-1.5 text-[11px] text-gray-600 whitespace-nowrap border-b border-gray-50 truncate max-w-[80px]">
                  {String(getField(o, col) ?? '')}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-center text-xs text-gray-400 italic">No data</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// ─── Widget Card on Canvas ─────────────────────────────────────────────────────
const WidgetCard = ({ widget, orders, onSettings, onDelete }) => {
  const { type } = widget;
  const displayTitle = widget.title || type;
  const isKPI = type === 'KPI Value';

  return (
    <div className="group relative w-full h-full bg-white rounded-xl border border-gray-200 shadow-sm
      hover:shadow-lg hover:border-blue-200 transition-all duration-200 overflow-hidden flex flex-col">

      {/* Hover action buttons — absolutely positioned, hidden until hover */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1
        opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto
        transition-opacity duration-200">
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onSettings(widget); }}
          className="w-7 h-7 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white transition-colors shadow-md"
          title="Configure widget"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        </button>
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onDelete(widget.id); }}
          className="w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors shadow-md"
          title="Remove widget"
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Card Title */}
      <div className={`flex-shrink-0 px-4 ${isKPI ? 'pt-3' : 'py-2.5 border-b border-gray-100'}`}>
        <span className="text-xs font-bold text-gray-700 truncate block pr-16">{displayTitle}</span>
      </div>

      {/* Card Content — actual rendered preview */}
      <div className={`flex-1 min-h-0 ${isKPI ? '' : 'px-2 pb-2 pt-1'}`}>
        {type === 'KPI Value'    && <KPIPreview    widget={widget} orders={orders} />}
        {type === 'Bar Chart'    && <ChartPreview  widget={widget} orders={orders} />}
        {type === 'Line Chart'   && <ChartPreview  widget={widget} orders={orders} />}
        {type === 'Area Chart'   && <ChartPreview  widget={widget} orders={orders} />}
        {type === 'Scatter Plot' && <ChartPreview  widget={widget} orders={orders} />}
        {type === 'Pie Chart'    && <PiePreview    widget={widget} orders={orders} />}
        {type === 'Table'        && <TablePreview  widget={widget} orders={orders} />}
      </div>
    </div>
  );
};

// ─── Save Icon ─────────────────────────────────────────────────────────────────
const SaveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
const DashboardConfigPage = () => {
  const navigate = useNavigate();

  const [placedWidgets, setPlacedWidgets]   = useState([]);
  const [orders, setOrders]                 = useState([]);
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [isPanelOpen, setIsPanelOpen]       = useState(false);
  const [loading, setLoading]               = useState(true);
  const [isSaving, setIsSaving]             = useState(false);
  const [toast, setToast]                   = useState(null);
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [openGroups, setOpenGroups]         = useState({ Charts: true, Tables: true, KPIs: true });
  const [refreshCountdown, setRefreshCountdown] = useState(10);
  const canvasRef = useRef(null);

  const userStr = localStorage.getItem('user');
  const user    = userStr ? JSON.parse(userStr) : null;

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [configRes, ordersRes] = await Promise.all([
        getDashboardWidgets(),
        getOrders(),
      ]);
      if (configRes.data?.widgets?.length && placedWidgets.length === 0) {
        setPlacedWidgets(configRes.data.widgets);
      }
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setRefreshCountdown(5);
    } catch { /* fresh start */ }
    finally { setLoading(false); }
  }, [placedWidgets.length]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          fetchData(false);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const addWidget = useCallback((type) => {
    const template = WIDGET_CATALOGUE.find(t => t.type === type);
    if (!template) return;
    const id  = `widget_${Date.now()}`;
    const col = (placedWidgets.length * 2) % 12;
    setPlacedWidgets(prev => [...prev, {
      id, type,
      title: type,
      description: '',
      layout: { i: id, x: col, y: Infinity, w: template.defaultW, h: template.defaultH, minW: template.minW, minH: template.minH },
      config: getDefaultConfig(type),
    }]);
    setSidebarOpen(false);
  }, [placedWidgets.length]);

  const handleCanvasDrop = useCallback((e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('widgetType');
    if (type) addWidget(type);
  }, [addWidget]);

  const handleLayoutChange = useCallback((layout) => {
    setPlacedWidgets(prev => prev.map(w => {
      const l = layout.find(item => item.i === w.id);
      return l ? { ...w, layout: { ...w.layout, ...l } } : w;
    }));
  }, []);

  const handleDelete = (id) => {
    if (window.confirm('Remove this widget from the canvas?')) {
      setPlacedWidgets(prev => prev.filter(w => w.id !== id));
      if (selectedWidget?.id === id) { setIsPanelOpen(false); setSelectedWidget(null); }
    }
  };

  const handleOpenSettings = (widget) => { setSelectedWidget(widget); setIsPanelOpen(true); };

  const handleSaveWidgetConfig = (updated) => {
    setPlacedWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
    setIsPanelOpen(false);
    setSelectedWidget(null);
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await saveDashboardConfig({ widgets: placedWidgets });
      navigate('/dashboard');
    } catch {
      showToast('Failed to save. Please try again.', 'error');
    } finally { setIsSaving(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleGroup = (g) => setOpenGroups(prev => ({ ...prev, [g]: !prev[g] }));

  // Build layout: filter out the placeholder so RGL doesn't get confused
  const lgLayout = placedWidgets.map(w => ({
    i: w.id,
    x: w.layout?.x ?? 0,
    y: w.layout?.y ?? Infinity,
    w: w.layout?.w ?? 4,
    h: w.layout?.h ?? 4,
    minW: w.layout?.minW ?? 1,
    minH: w.layout?.minH ?? 1,
  }));

  const widgetCount = placedWidgets.length;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col" style={{ fontFamily: "'Outfit', sans-serif" }}>

      {/* ══ NAVBAR ══════════════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 inset-x-0 h-[60px] bg-white border-b border-gray-200 z-[100] px-4 md:px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 md:gap-8">
          <button className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600"
            onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '✕' : '☰'}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md">📊</div>
            <span className="text-base font-black text-gray-900 tracking-tight hidden sm:block">DashBuilder</span>
          </div>
          <div className="hidden md:flex items-center h-[60px]">
            <Link to="/dashboard" className="text-sm font-semibold text-blue-600 border-b-2 border-blue-600 h-full flex items-center px-4">Dashboard</Link>
            <Link to="/customer-orders" className="text-sm font-semibold text-gray-400 hover:text-gray-700 h-full flex items-center px-4 transition-colors">Customer Orders</Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <span className="text-xs font-bold text-blue-700 hidden sm:block pr-0.5">{user?.name || 'Admin User'}</span>
          </div>
          <button onClick={handleLogout} className="text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-red-100 transition-all">
            Logout
          </button>
        </div>
      </nav>

      {/* ══ BODY ════════════════════════════════════════════════════════════════ */}
      <div className="pt-[60px] flex flex-1 overflow-hidden relative">

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-[90] bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ══ LEFT SIDEBAR ════════════════════════════════════════════════════ */}
        <aside className={`
          fixed md:static top-[60px] left-0 bottom-0 z-[95]
          w-[190px] bg-white border-r border-gray-200 flex flex-col
          transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:flex-shrink-0
        `}>
          <div className="px-4 py-4 border-b border-gray-100 bg-white">
            <h2 className="text-xs font-black text-gray-800 uppercase tracking-[0.15em]">Widget Panel</h2>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">Drag or click to add widgets</p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {Object.keys(GROUP_META).map(group => (
              <SidebarGroup
                key={group}
                groupName={group}
                items={WIDGET_CATALOGUE.filter(w => w.group === group)}
                open={openGroups[group]}
                onToggle={() => toggleGroup(group)}
                onAddWidget={addWidget}
              />
            ))}
          </div>

          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-center gap-2">
            <GripIcon />
            <p className="text-[10px] text-gray-400 font-medium italic">Drag widgets to canvas to add them</p>
          </div>
        </aside>

        {/* ══ CANVAS AREA ═════════════════════════════════════════════════════ */}
        <main
          ref={canvasRef}
          className="flex-1 flex flex-col overflow-y-auto min-w-0 bg-gray-50"
          onDragOver={e => e.preventDefault()}
          onDrop={handleCanvasDrop}
        >
          {/* Page Header */}
          <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
            <div>
              <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Dashboard Configuration</h1>
              <p className="text-xs text-gray-400 font-semibold tracking-wider mt-1">
                Canvas Grid (12 columns)&nbsp;—&nbsp;
                <span className="text-blue-500">{widgetCount}</span>
                {' '}widget{widgetCount !== 1 ? 's' : ''} placed
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-blue-50/50 border border-blue-100 px-3 py-1.5 rounded-lg mr-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sync</span>
                <span className="text-blue-600 font-mono font-bold text-xs w-5 text-center">{refreshCountdown}s</span>
              </div>
              <button
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
                  text-white text-xs font-black uppercase tracking-widest rounded-xl
                  shadow-lg shadow-blue-500/25 transition-all active:scale-95"
              >
                <SaveIcon />
                {isSaving ? 'Saving…' : 'Save Configuration'}
              </button>
            </div>
          </div>

          {/* Grid Canvas */}
          <div className="flex-1 p-5">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-gray-400 font-bold mt-4 uppercase tracking-widest">Loading…</p>
                </div>
              </div>
            ) : (
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: 'white',
                  backgroundImage: 'radial-gradient(circle, #cbd5e1 1.2px, transparent 1.2px)',
                  backgroundSize: '28px 28px',
                  backgroundPosition: '0 0',
                  minHeight: 'calc(100vh - 185px)',
                  border: '2px dashed #cbd5e1',
                  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.025)',
                }}
              >
                {/* Empty canvas message */}
                {widgetCount === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl px-16 py-10 flex flex-col items-center gap-3 bg-white/80">
                      <div className="text-5xl opacity-20">📊</div>
                      <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Drop widget here</p>
                      <p className="text-xs text-gray-400 font-medium">Drag widgets from the left panel to start</p>
                    </div>
                  </div>
                )}

                <ResponsiveGridLayout
                  className="layout"
                  layouts={{ lg: lgLayout, md: lgLayout, sm: lgLayout, xs: lgLayout }}
                  breakpoints={{ lg: 1200, md: 1024, sm: 768, xs: 480 }}
                  cols={{ lg: 12, md: 8, sm: 4, xs: 4 }}
                  rowHeight={60}
                  margin={[12, 12]}
                  containerPadding={[16, 16]}
                  onLayoutChange={handleLayoutChange}
                  resizeHandles={['se']}
                >
                  {/* Real widget cards */}
                  {placedWidgets.map(w => (
                    <div key={w.id}>
                      <WidgetCard
                        widget={w}
                        orders={orders}
                        onSettings={handleOpenSettings}
                        onDelete={handleDelete}
                      />
                    </div>
                  ))}

                  {/* "Drop widget here" placeholder fills remaining space in first row */}
                  {(() => {
                    const usedInRow0 = placedWidgets
                      .filter(w => (w.layout?.y ?? 0) === 0)
                      .reduce((sum, w) => sum + (w.layout?.w ?? 4), 0);
                    const remain = 12 - (usedInRow0 % 12);
                    if (remain >= 12 || widgetCount === 0) return null;
                    const startX = usedInRow0 % 12;
                    return (
                      <div key="__drop_ph__" data-grid={{ x: startX, y: 0, w: remain, h: 2, static: true }}>
                        <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                          <p className="text-sm text-gray-400 text-center font-medium">Drop widget here</p>
                        </div>
                      </div>
                    );
                  })()}
                </ResponsiveGridLayout>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ══ WIDGET CONFIG PANEL ═════════════════════════════════════════════════ */}
      {isPanelOpen && selectedWidget && (
        <WidgetConfigPanel
          widget={selectedWidget}
          onSave={handleSaveWidgetConfig}
          onClose={() => { setIsPanelOpen(false); setSelectedWidget(null); }}
        />
      )}

      {/* ══ TOAST ═══════════════════════════════════════════════════════════════ */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ══ STYLES ══════════════════════════════════════════════════════════════ */}
      <style>{`
        @keyframes slideUpToast {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .react-grid-placeholder {
          background: rgba(59,130,246,0.07) !important;
          border-radius: 12px !important;
          border: 2px dashed rgba(59,130,246,0.3) !important;
          opacity: 1 !important;
        }
        .react-resizable-handle { opacity: 0; transition: opacity 0.15s; }
        .react-grid-item:hover .react-resizable-handle { opacity: 1; }
        .react-resizable-handle::after { border-color: #3b82f6 !important; }
      `}</style>
    </div>
  );
};

export default DashboardConfigPage;
