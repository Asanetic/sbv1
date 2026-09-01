'use client';

import { useEffect, useState } from 'react';

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

// Same "this month" default the dashboard loads with — Clear returns to
// this, not a blank range, since the API itself defaults to this month.
function thisMonthRange() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return { siteId: '', dateFrom: toDateStr(monthStart), dateTo: toDateStr(now) };
}

function formatDateLabel(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// Tells the user in plain words what data is currently on screen — which
// site, and which date range — since both are filterable and the numbers
// silently change underneath them otherwise.
function viewingLabel(filters, sites) {
  const siteName = filters.siteId
    ? sites.find((s) => s.id === filters.siteId)?.name || 'Selected site'
    : 'All sites';

  if (!filters.dateFrom || !filters.dateTo) {
    return `Showing ${siteName}`;
  }

  const range =
    filters.dateFrom === filters.dateTo
      ? formatDateLabel(filters.dateFrom)
      : `${formatDateLabel(filters.dateFrom)} – ${formatDateLabel(filters.dateTo)}`;

  return `Showing ${siteName} · ${range}`;
}

export default function DashboardHeader({ sites = [], filters, onApply }) {
  const [siteId, setSiteId] = useState(filters.siteId);
  const [dateFrom, setDateFrom] = useState(filters.dateFrom);
  const [dateTo, setDateTo] = useState(filters.dateTo);

  useEffect(() => {
    setSiteId(filters.siteId);
    setDateFrom(filters.dateFrom);
    setDateTo(filters.dateTo);
  }, [filters.siteId, filters.dateFrom, filters.dateTo]);

  const rangeInvalid = dateFrom && dateTo && dateFrom > dateTo;

  const dirty =
    siteId !== filters.siteId || dateFrom !== filters.dateFrom || dateTo !== filters.dateTo;

  function handleApply() {
    if (rangeInvalid) return;
    onApply({ siteId, dateFrom, dateTo });
  }

  function handleReset() {
    const defaults = thisMonthRange();
    setSiteId(defaults.siteId);
    setDateFrom(defaults.dateFrom);
    setDateTo(defaults.dateTo);
    onApply(defaults);
  }

  const defaults = thisMonthRange();
  const hasActiveFilters =
    filters.siteId !== defaults.siteId ||
    filters.dateFrom !== defaults.dateFrom ||
    filters.dateTo !== defaults.dateTo;

  return (
    <div className="dash-header">
      <div>
        <h3 className="dash-header-title">Dashboard</h3>
        <div className="dash-header-sub">Overview of finance, people, work &amp; performance</div>
        <div className="dash-header-viewing">{viewingLabel(filters, sites)}</div>
      </div>

      <div className="dash-header-filters">
        <div className="filter-field">
          <label>From</label>
          <input
            type="date"
            className="dash-date-input"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div className="filter-field">
          <label>To</label>
          <input
            type="date"
            className="dash-date-input"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        <div className="filter-field">
          <label>Site</label>
          <select
            className="dash-site-select"
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
          >
            <option value="">All sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="dash-apply-btn"
          disabled={!dirty || rangeInvalid}
          onClick={handleApply}
        >
          Apply
        </button>

        {hasActiveFilters && (
          <button type="button" className="dash-reset-btn" onClick={handleReset}>
            Clear
          </button>
        )}

        {rangeInvalid && <span className="dash-filter-error">"From" must be before "To"</span>}
      </div>

      <style jsx>{`
        .dash-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 4px 2px 18px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .dash-header-title {
          margin: 0;
          font-weight: 700;
          font-size: 1.4rem;
          color: #0f172a;
        }
        .dash-header-sub {
          color: #64748b;
          font-size: 0.85rem;
          margin-top: 2px;
        }
        .dash-header-viewing {
          color: #0932a8;
          font-size: 0.8rem;
          font-weight: 700;
          margin-top: 6px;
        }
        .dash-header-filters {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }
        .filter-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .filter-field label {
          color: #64748b;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .dash-date-input,
        .dash-site-select {
          border: 1px solid #e6e8ec;
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 0.85rem;
          color: #0f172a;
          background: #fff;
          height: 36px;
        }
        .dash-apply-btn {
          height: 36px;
          padding: 0 16px;
          border: none;
          border-radius: 8px;
          background: #0932a8;
          color: #fff;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
        }
        .dash-apply-btn:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
        }
        .dash-reset-btn {
          height: 36px;
          padding: 0 14px;
          border: 1px solid #e6e8ec;
          border-radius: 8px;
          background: #fff;
          color: #64748b;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }
        .dash-filter-error {
          color: #dc2626;
          font-size: 0.78rem;
          font-weight: 600;
          align-self: center;
        }
      `}</style>
    </div>
  );
}
