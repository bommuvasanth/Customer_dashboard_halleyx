import React, { useState, useEffect } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const NUMERIC_METRICS   = ['Total amount', 'Unit price', 'Quantity'];
const ALL_METRICS       = ['Customer ID', 'Customer name', 'Email id', 'Address', 'Order date', 'Product', 'Created by', 'Status', 'Total amount', 'Unit price', 'Quantity'];
const AXIS_OPTIONS      = ['Product', 'Quantity', 'Unit price', 'Total amount', 'Status', 'Created by', 'Duration'];
const PIE_DATA_OPTIONS  = ['Product', 'Quantity', 'Unit price', 'Total amount', 'Status', 'Created by'];
const TABLE_COLUMNS     = ['Customer ID', 'Customer name', 'Email id', 'Phone number', 'Address', 'Order ID', 'Order date', 'Product', 'Quantity', 'Unit price', 'Total amount', 'Status', 'Created by'];
const AGGREGATIONS      = ['Sum', 'Average', 'Count'];
const DATA_FORMATS      = ['Number', 'Currency'];
const SORT_OPTIONS      = ['Ascending', 'Descending', 'Order date'];
const PAGINATION_OPTIONS = ['5', '10', '15'];

const isValidHex = (v) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(v);

// ─── Field sub-components ─────────────────────────────────────────────────────
const FieldError = ({ msg }) =>
  msg ? <p className="mt-1 text-xs font-semibold text-red-500">{msg}</p> : null;

const SectionLabel = ({ label }) => (
  <div className="pt-4 pb-1">
    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">{label}</p>
    <div className="mt-1.5 border-t border-gray-100" />
  </div>
);

const TextInput = ({ label, value, onChange, error, readOnly, placeholder }) => (
  <div>
    <label className="block text-xs font-bold text-gray-600 mb-1.5">{label}</label>
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      readOnly={readOnly}
      placeholder={placeholder || ''}
      className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all
        ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' :
          error ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300/30' :
          'border-gray-200 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-300/20'}`}
    />
    <FieldError msg={error} />
  </div>
);

const Textarea = ({ label, value, onChange }) => (
  <div>
    <label className="block text-xs font-bold text-gray-600 mb-1.5">{label} <span className="text-gray-400 font-normal">(optional)</span></label>
    <textarea
      rows={2}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none resize-none focus:border-blue-400 focus:ring-2 focus:ring-blue-300/20 transition-all"
    />
  </div>
);

const NumberInput = ({ label, value, onChange, error, min, max, required }) => (
  <div>
    <label className="block text-xs font-bold text-gray-600 mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={e => onChange(e.target.value)}
      className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all
        ${error ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300/30' :
          'border-gray-200 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-300/20'}`}
    />
    <FieldError msg={error} />
  </div>
);

const Dropdown = ({ label, value, onChange, options, error, disabled, required, optional }) => (
  <div>
    <label className="block text-xs font-bold text-gray-600 mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {optional && <span className="text-gray-400 font-normal ml-1">(optional)</span>}
    </label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all
        ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' :
          error ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300/30' :
          'border-gray-200 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-300/20'}`}
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <FieldError msg={error} />
  </div>
);

const ColorInput = ({ label, value, onChange, error, optional }) => (
  <div>
    <label className="block text-xs font-bold text-gray-600 mb-1.5">
      {label}{optional && <span className="text-gray-400 font-normal ml-1">(optional)</span>}
    </label>
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={isValidHex(value) ? value : '#3b82f6'}
        onChange={e => onChange(e.target.value)}
        className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5 bg-white"
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="#3b82f6"
        maxLength={7}
        className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-mono outline-none transition-all
          ${error ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300/30' :
            'border-gray-200 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-300/20'}`}
      />
    </div>
    <FieldError msg={error} />
  </div>
);

const Checkbox = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2.5 cursor-pointer group">
    <input
      type="checkbox"
      checked={checked}
      onChange={e => onChange(e.target.checked)}
      className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
    />
    <span className="text-xs font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{label}</span>
  </label>
);

// ─── Multiselect Columns Picker ───────────────────────────────────────────────
const MultiSelectColumns = ({ selected, onChange, error }) => {
  const [open, setOpen] = useState(false);
  const toggle = (col) => {
    const next = selected.includes(col) ? selected.filter(c => c !== col) : [...selected, col];
    onChange(next);
  };
  return (
    <div className="relative">
      <label className="block text-xs font-bold text-gray-600 mb-1.5">
        Choose Columns <span className="text-red-500">*</span>
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full px-3 py-2.5 rounded-xl border text-sm text-left flex items-center justify-between outline-none transition-all
          ${error ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white focus:border-blue-400'}`}
      >
        <span className={selected.length === 0 ? 'text-gray-400' : 'text-gray-800 font-medium'}>
          {selected.length === 0 ? 'Select columns…' : `${selected.length} column${selected.length > 1 ? 's' : ''} selected`}
        </span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-[200px] overflow-y-auto">
          {TABLE_COLUMNS.map(col => (
            <label key={col} className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors ${selected.includes(col) ? 'bg-blue-50/50' : ''}`}>
              <input
                type="checkbox"
                checked={selected.includes(col)}
                onChange={() => toggle(col)}
                className="w-3.5 h-3.5 accent-blue-500 rounded cursor-pointer"
              />
              <span className="text-xs font-medium text-gray-700">{col}</span>
              {selected.includes(col) && <span className="ml-auto text-blue-500 text-xs">✓</span>}
            </label>
          ))}
        </div>
      )}
      <FieldError msg={error} />
    </div>
  );
};

// ─── Filter Row ───────────────────────────────────────────────────────────────
const FilterRow = ({ filter, onChange, onRemove }) => (
  <div className="flex items-center gap-2 py-1.5">
    <select
      value={filter.field}
      onChange={e => onChange({ ...filter, field: e.target.value })}
      className="flex-1 px-2 py-2 rounded-lg border border-gray-200 text-xs bg-white outline-none focus:border-blue-400"
    >
      {TABLE_COLUMNS.map(c => <option key={c}>{c}</option>)}
    </select>
    <input
      type="text"
      value={filter.value}
      onChange={e => onChange({ ...filter, value: e.target.value })}
      placeholder="Value…"
      className="flex-1 px-2 py-2 rounded-lg border border-gray-200 text-xs bg-white outline-none focus:border-blue-400"
    />
    <button onClick={onRemove} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center text-xs transition-colors flex-shrink-0">✕</button>
  </div>
);

// ─── KPI FIELDS ────────────────────────────────────────────────────────────────
const KPIFields = ({ f, e, set, setE }) => {
  const isNumericMetric = NUMERIC_METRICS.includes(f.metric);
  return (
    <>
      <SectionLabel label="Data Settings" />
      <Dropdown
        label="Select Metric"
        required
        value={f.metric}
        options={ALL_METRICS}
        error={e.metric}
        onChange={v => { set(p => ({ ...p, metric: v })); setE(p => ({ ...p, metric: '' })); }}
      />
      <Dropdown
        label="Aggregation"
        required
        value={f.aggregation}
        options={AGGREGATIONS}
        error={e.aggregation}
        disabled={!isNumericMetric}
        onChange={v => { set(p => ({ ...p, aggregation: v })); setE(p => ({ ...p, aggregation: '' })); }}
      />
      {!isNumericMetric && (
        <p className="text-[10px] text-amber-500 font-semibold -mt-1">⚠ Aggregation is disabled for non-numeric fields</p>
      )}
      <Dropdown
        label="Data Format"
        required
        value={f.format}
        options={DATA_FORMATS}
        error={e.format}
        onChange={v => { set(p => ({ ...p, format: v })); setE(p => ({ ...p, format: '' })); }}
      />
      <NumberInput
        label="Decimal Precision"
        required
        value={f.precision}
        min={0}
        error={e.precision}
        onChange={v => { set(p => ({ ...p, precision: v })); setE(p => ({ ...p, precision: '' })); }}
      />
    </>
  );
};

// ─── CHART FIELDS ─────────────────────────────────────────────────────────────
const ChartFields = ({ f, e, set, setE }) => (
  <>
    <SectionLabel label="Data Settings" />
    <Dropdown
      label="Choose X-Axis Data"
      required
      value={f.xAxis}
      options={AXIS_OPTIONS}
      error={e.xAxis}
      onChange={v => { set(p => ({ ...p, xAxis: v })); setE(p => ({ ...p, xAxis: '' })); }}
    />
    <Dropdown
      label="Choose Y-Axis Data"
      required
      value={f.yAxis}
      options={AXIS_OPTIONS}
      error={e.yAxis}
      onChange={v => { set(p => ({ ...p, yAxis: v })); setE(p => ({ ...p, yAxis: '' })); }}
    />
    <SectionLabel label="Styling" />
    <ColorInput
      label="Chart Color"
      optional
      value={f.color}
      error={e.color}
      onChange={v => {
        set(p => ({ ...p, color: v }));
        setE(p => ({ ...p, color: v && !isValidHex(v) ? 'Please enter a valid HEX color code' : '' }));
      }}
    />
    <Checkbox label="Show Data Labels" checked={f.showLabel} onChange={v => set(p => ({ ...p, showLabel: v }))} />
  </>
);

// ─── PIE FIELDS ───────────────────────────────────────────────────────────────
const PieFields = ({ f, e, set, setE }) => (
  <>
    <SectionLabel label="Data Settings" />
    <Dropdown
      label="Choose Chart Data"
      required
      value={f.dataField}
      options={PIE_DATA_OPTIONS}
      error={e.dataField}
      onChange={v => { set(p => ({ ...p, dataField: v })); setE(p => ({ ...p, dataField: '' })); }}
    />
    <Checkbox label="Show Legend" checked={f.showLegend} onChange={v => set(p => ({ ...p, showLegend: v }))} />
  </>
);

// ─── TABLE FIELDS ─────────────────────────────────────────────────────────────
const TableFields = ({ f, e, set, setE }) => (
  <>
    <SectionLabel label="Data Settings" />
    <MultiSelectColumns
      selected={f.columns || []}
      error={e.columns}
      onChange={v => { set(p => ({ ...p, columns: v })); setE(p => ({ ...p, columns: '' })); }}
    />
    <Dropdown
      label="Sort By"
      optional
      value={f.sortBy || 'Ascending'}
      options={SORT_OPTIONS}
      onChange={v => set(p => ({ ...p, sortBy: v }))}
    />
    <Dropdown
      label="Pagination"
      optional
      value={String(f.rowsPerPage || '10')}
      options={PAGINATION_OPTIONS}
      onChange={v => set(p => ({ ...p, rowsPerPage: v }))}
    />

    {/* Apply Filter */}
    <div className="space-y-1.5">
      <Checkbox
        label="Apply Filter"
        checked={f.applyFilter || false}
        onChange={v => set(p => ({ ...p, applyFilter: v }))}
      />
      {f.applyFilter && (
        <div className="pl-6 space-y-1 pt-1">
          {(f.filters || []).map((filter, idx) => (
            <FilterRow
              key={idx}
              filter={filter}
              onChange={updated => {
                const next = [...(f.filters || [])];
                next[idx] = updated;
                set(p => ({ ...p, filters: next }));
              }}
              onRemove={() => {
                const next = (f.filters || []).filter((_, i) => i !== idx);
                set(p => ({ ...p, filters: next }));
              }}
            />
          ))}
          <button
            type="button"
            onClick={() => set(p => ({ ...p, filters: [...(p.filters || []), { field: TABLE_COLUMNS[0], value: '' }] }))}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors mt-1"
          >
            <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">+</span>
            Add Filter
          </button>
        </div>
      )}
    </div>

    <SectionLabel label="Styling" />
    <NumberInput
      label="Font Size (px)"
      value={f.fontSize || 14}
      min={12}
      max={18}
      error={e.fontSize}
      onChange={v => {
        set(p => ({ ...p, fontSize: v }));
        const n = parseInt(v);
        setE(p => ({ ...p, fontSize: (!v || isNaN(n) || n < 12 || n > 18) ? 'Allowed range: 12–18' : '' }));
      }}
    />
    <ColorInput
      label="Header Background"
      optional
      value={f.headerBg || '#54bd95'}
      error={e.headerBg}
      onChange={v => {
        set(p => ({ ...p, headerBg: v }));
        setE(p => ({ ...p, headerBg: v && !isValidHex(v) ? 'Please enter a valid HEX color code' : '' }));
      }}
    />
  </>
);

// ─── MAIN PANEL COMPONENT ─────────────────────────────────────────────────────
const WidgetConfigPanel = ({ widget, onSave, onClose }) => {
  const { type } = widget;

  // ── Init state from existing widget config
  const [title, setTitle]   = useState(widget.title || type);
  const [desc, setDesc]     = useState(widget.description || '');
  const [w, setW]           = useState(String(widget.layout?.w ?? getDefaultW(type)));
  const [h, setH]           = useState(String(widget.layout?.h ?? getDefaultH(type)));
  const [cfg, setCfg]       = useState({ ...getDefaultConfig(type), ...(widget.config || {}) });

  // ── Error state per field
  const [errs, setErrs] = useState({});
  const setE = (fn) => setErrs(fn);

  useEffect(() => {
    setTitle(widget.title || type);
    setDesc(widget.description || '');
    setW(String(widget.layout?.w ?? getDefaultW(type)));
    setH(String(widget.layout?.h ?? getDefaultH(type)));
    setCfg({ ...getDefaultConfig(type), ...(widget.config || {}) });
    setErrs({});
  }, [widget]);

  // ── Validate and Save
  const handleSave = () => {
    const newErrs = {};

    // Common mandatory fields
    if (!title.trim())    newErrs.title = 'Please fill the field';
    const wNum = parseInt(w); if (!w || isNaN(wNum) || wNum < 1) newErrs.w = 'Please fill the field';
    const hNum = parseInt(h); if (!h || isNaN(hNum) || hNum < 1) newErrs.h = 'Please fill the field';

    // Type-specific mandatory validation
    if (type === 'KPI Value') {
      if (!cfg.metric)          newErrs.metric    = 'Please fill the field';
      if (!cfg.aggregation)     newErrs.aggregation = 'Please fill the field';
      if (!cfg.format)          newErrs.format    = 'Please fill the field';
      if (cfg.precision === '' || cfg.precision === undefined || parseInt(cfg.precision) < 0)
                                newErrs.precision = 'Please fill the field';
    }
    if (['Bar Chart', 'Line Chart', 'Area Chart', 'Scatter Plot'].includes(type)) {
      if (!cfg.xAxis) newErrs.xAxis = 'Please fill the field';
      if (!cfg.yAxis) newErrs.yAxis = 'Please fill the field';
      if (cfg.color && !isValidHex(cfg.color)) newErrs.color = 'Please enter a valid HEX color code';
    }
    if (type === 'Pie Chart') {
      if (!cfg.dataField) newErrs.dataField = 'Please fill the field';
    }
    if (type === 'Table') {
      if (!cfg.columns || cfg.columns.length === 0) newErrs.columns = 'Please fill the field';
      const fs = parseInt(cfg.fontSize);
      if (cfg.fontSize !== undefined && (isNaN(fs) || fs < 12 || fs > 18)) newErrs.fontSize = 'Allowed range: 12–18';
      if (cfg.headerBg && !isValidHex(cfg.headerBg)) newErrs.headerBg = 'Please enter a valid HEX color code';
    }

    if (Object.keys(newErrs).length > 0) {
      setErrs(newErrs);
      return;
    }

    // All valid — call parent
    onSave({
      ...widget,
      title: title.trim(),
      description: desc.trim(),
      layout: { ...widget.layout, w: parseInt(w), h: parseInt(h) },
      config: { ...cfg, precision: parseInt(cfg.precision) || 0 },
    });
  };

  const typeLabel = {
    'KPI Value': 'KPI',
    'Pie Chart': 'Pie chart',
    'Table':     'Table',
  }[type] || type;

  // ── Shared props passed to each field section
  const fieldProps = { f: cfg, e: errs, set: setCfg, setE };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 w-[380px] bg-white z-[210] shadow-2xl flex flex-col border-l border-gray-200"
        style={{ animation: 'slideInFromRight 0.32s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' }}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Widget Configuration</h2>
            <p className="text-[11px] font-semibold text-gray-400 mt-0.5">{typeLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-gray-500 text-sm transition-colors mt-0.5"
          >
            ✕
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-7 py-5 space-y-4">

          {/* Common: Title */}
          <TextInput
            label={<>Widget Title <span className="text-red-500">*</span></>}
            value={title}
            error={errs.title}
            onChange={v => { setTitle(v); setErrs(p => ({ ...p, title: '' })); }}
          />

          {/* Common: Widget Type (read-only) */}
          <TextInput
            label="Widget Type"
            value={typeLabel}
            readOnly
            onChange={() => {}}
          />

          {/* Common: Description */}
          <Textarea label="Description" value={desc} onChange={setDesc} />

          {/* Widget Size */}
          <SectionLabel label="Widget Size" />
          <div className="grid grid-cols-2 gap-3">
            <NumberInput
              label={<>Width in Columns <span className="text-red-500">*</span></>}
              value={w}
              min={1}
              error={errs.w}
              onChange={v => { setW(v); setErrs(p => ({ ...p, w: '' })); }}
            />
            <NumberInput
              label={<>Height in Rows <span className="text-red-500">*</span></>}
              value={h}
              min={1}
              error={errs.h}
              onChange={v => { setH(v); setErrs(p => ({ ...p, h: '' })); }}
            />
          </div>

          {/* Type-specific fields */}
          {type === 'KPI Value' && <KPIFields {...fieldProps} />}
          {['Bar Chart', 'Line Chart', 'Area Chart', 'Scatter Plot'].includes(type) && <ChartFields {...fieldProps} />}
          {type === 'Pie Chart' && <PieFields {...fieldProps} />}
          {type === 'Table'     && <TableFields {...fieldProps} />}

        </div>

        {/* ── Footer Buttons ── */}
        <div className="flex-shrink-0 px-7 py-5 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-xs font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            Save Widget
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInFromRight {
          from { opacity: 0; transform: translateX(80px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDefaultW(type) {
  if (type === 'KPI Value') return 2;
  if (type === 'Pie Chart' || type === 'Table') return 4;
  return 5; // all charts
}
function getDefaultH(type) {
  if (type === 'KPI Value') return 2;
  if (type === 'Pie Chart' || type === 'Table') return 4;
  return 5;
}
function getDefaultConfig(type) {
  if (type === 'KPI Value')
    return { metric: 'Total amount', aggregation: 'Sum', format: 'Number', precision: 0 };
  if (['Bar Chart', 'Line Chart', 'Area Chart', 'Scatter Plot'].includes(type))
    return { xAxis: 'Product', yAxis: 'Total amount', color: '#3b82f6', showLabel: true };
  if (type === 'Pie Chart')
    return { dataField: 'Status', showLegend: true };
  if (type === 'Table')
    return { columns: ['Customer name', 'Product', 'Total amount', 'Status'], sortBy: 'Ascending', rowsPerPage: '10', applyFilter: false, filters: [], fontSize: 14, headerBg: '#54bd95' };
  return {};
}

export default WidgetConfigPanel;
