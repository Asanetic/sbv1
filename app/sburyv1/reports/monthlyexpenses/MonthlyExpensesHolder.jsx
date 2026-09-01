'use client';

import { useEffect, useState } from 'react';

import ElforgeChart from '../../../components/ElforgeChart';
import { exportTableToExcel } from '../../../MosyUtils/exportToExcel';
import { mosyGetData, mosyPrintToPdf, toNum } from '../../../MosyUtils/hiveUtils';
import { getApiRoutes } from '../../AppRoutes/apiRoutesHandler';
import { fmtKES } from '../../dashboard/main/dashboardFormat';

const apiRoutes = getApiRoutes();

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const EMPTY_DATA = {
  sites: [],
  years: [],
  monthly: [],
  by_site: [],
  by_category: [],
  total: { value: 0, txn_count: 0 },
};

function defaultFilters() {
  return { siteId: '', year: new Date().getFullYear(), months: [] };
}

export default function MonthlyExpensesHolder() {
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(defaultFilters);

  // Draft filter state — only committed to `filters` (and fetched) on Apply.
  const [draftSiteId, setDraftSiteId] = useState(filters.siteId);
  const [draftYear, setDraftYear] = useState(filters.year);
  const [draftMonths, setDraftMonths] = useState(filters.months);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const params = { year: String(filters.year) };
      if (filters.siteId) params.site_id = filters.siteId;
      if (filters.months.length) params.months = filters.months.join(',');

      const response = await mosyGetData({
        endpoint: apiRoutes.reports.monthlyexpenses,
        params,
      });

      if (response?.status === 'success') {
        setData({
          sites: response?.sites || [],
          years: response?.years || [],
          monthly: response?.monthly || [],
          by_site: response?.by_site || [],
          by_category: response?.by_category || [],
          total: response?.total || { value: 0, txn_count: 0 },
        });
        setError(null);
      } else {
        setError(response?.message || 'Failed to load monthly expenses report');
      }

      setLoading(false);
    }

    fetchData();
  }, [filters]);

  const dirty =
    draftSiteId !== filters.siteId ||
    draftYear !== filters.year ||
    draftMonths.join(',') !== filters.months.join(',');

  const hasActiveFilters = filters.siteId || filters.months.length > 0;

  function toggleMonth(m) {
    setDraftMonths((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m].sort((a, b) => a - b)));
  }

  function handleApply() {
    setFilters({ siteId: draftSiteId, year: draftYear, months: [...draftMonths] });
  }

  function handleClear() {
    const defaults = defaultFilters();
    setDraftSiteId(defaults.siteId);
    setDraftYear(defaults.year);
    setDraftMonths(defaults.months);
    setFilters(defaults);
  }

  const yearOptions = [...new Set([defaultFilters().year, ...data.years])].sort((a, b) => b - a);
  const siteName = filters.siteId ? data.sites.find((s) => s.id === filters.siteId)?.name || 'Selected site' : 'All sites';
  const monthsLabel = filters.months.length
    ? filters.months.map((m) => MONTH_NAMES[m - 1]).join(', ')
    : 'All months';

  return (
    <div className="mexp-wrapper col-md-12 p-0 m-0">
      <div className="mexp-header">
        <div>
          <h3 className="mexp-title">Monthly Expenses</h3>
          <div className="mexp-sub">Expenses (expenses.rate) by month, site and category.</div>
          <div className="mexp-viewing">
            Showing {siteName} · {filters.year} · {monthsLabel}
          </div>
        </div>

        <div className="mexp-filters">
          <div className="filter-field">
            <label>Year</label>
            <select className="mexp-select" value={draftYear} onChange={(e) => setDraftYear(Number(e.target.value))}>
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label>Site</label>
            <select className="mexp-select" value={draftSiteId} onChange={(e) => setDraftSiteId(e.target.value)}>
              <option value="">All sites</option>
              {data.sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-field months-field">
            <label>Months</label>
            <div className="months-grid">
              {MONTH_NAMES.map((label, i) => {
                const m = i + 1;
                const checked = draftMonths.includes(m);
                return (
                  <button
                    type="button"
                    key={m}
                    className={`month-chip ${checked ? 'active' : ''}`}
                    onClick={() => toggleMonth(m)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <button type="button" className="mexp-apply-btn" disabled={!dirty} onClick={handleApply}>
            Apply
          </button>

          {hasActiveFilters && (
            <button type="button" className="mexp-reset-btn" onClick={handleClear}>
              Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="col-md-12 text-center py-5">
          <div className="spinner-border text-primary" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
            <span className="visually-hidden d-none">Loading...</span>
          </div>
          <p className="text-muted mt-3 mb-0">Loading report...</p>
        </div>
      ) : error ? (
        <div className="col-md-12 py-5">
          <div className="alert alert-danger text-center mb-0">
            <i className="fa fa-exclamation-triangle mr-2"></i>
            {error}
          </div>
        </div>
      ) : (
        <>
          <div className="mexp-tiles-row">
            <div className="mexp-tile">
              <div className="mexp-tile-label">Total Expenses</div>
              <div className="mexp-tile-value">{fmtKES(data.total.value)}</div>
              <div className="mexp-tile-note">{toNum(data.total.txn_count)} entries</div>
            </div>
          </div>

          <div className="row m-0">
            <div className="col-md-6 mb-3">
              <div className="mexp-section">
                <h5>Expenses by Month</h5>
                {data.monthly.every((r) => r.value === 0) ? (
                  <div className="mexp-empty">No expenses for this selection.</div>
                ) : (
                  <ElforgeChart
                    chartType="area"
                    dataKey="label"
                    data={data.monthly}
                    series={[{ key: 'value', color: '#b45309', name: 'Expenses' }]}
                    height={260}
                  />
                )}
              </div>
            </div>

            <div className="col-md-6 mb-3">
              <div className="mexp-section">
                <h5>Expenses by Site</h5>
                {data.by_site.length === 0 ? (
                  <div className="mexp-empty">No expenses for this selection.</div>
                ) : (
                  <ElforgeChart
                    chartType="bar"
                    dataKey="label"
                    data={data.by_site}
                    series={[{ key: 'value', color: '#0932a8', name: 'Expenses' }]}
                    height={260}
                  />
                )}
              </div>
            </div>

            <div className="col-md-12 mb-3">
              <div className="mexp-section">
                <h5>Expenses by Category</h5>
                {data.by_category.length === 0 ? (
                  <div className="mexp-empty">No expenses for this selection.</div>
                ) : (
                  <ElforgeChart
                    chartType="bar"
                    dataKey="label"
                    data={data.by_category}
                    series={[{ key: 'value', color: '#b45309', name: 'Expenses' }]}
                    height={260}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="mexp-section">
            <div className="mexp-section-head">
              <h5>Monthly Breakdown</h5>
              <div className="mexp-export-tray">
                <div
                  className="mexp-export-btn"
                  onClick={() => mosyPrintToPdf({ elemId: 'mexp_print_card', defaultTitle: 'Monthly Expenses Report' })}
                >
                  <i className="fa fa-print mr-1"></i> Print / PDF
                </div>
                <div
                  className="mexp-export-btn"
                  onClick={() => exportTableToExcel('mexp_data_table', `Monthly Expenses ${filters.year}.xlsx`)}
                >
                  <i className="fa fa-file-excel-o mr-1"></i> Export to Excel
                </div>
              </div>
            </div>
            <div className="mexp-table-wrap" id="mexp_print_card">
              <table className="mexp-table" id="mexp_data_table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Month</th>
                    <th>Expenses</th>
                    <th>Entries</th>
                  </tr>
                </thead>
                <tbody>
                  {data.monthly.map((row, i) => (
                    <tr key={row.month}>
                      <td>{i + 1}</td>
                      <td>{row.label}</td>
                      <td>{fmtKES(row.value)}</td>
                      <td>{toNum(row.txn_count)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td></td>
                    <td>Total</td>
                    <td>{fmtKES(data.total.value)}</td>
                    <td>{toNum(data.total.txn_count)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .mexp-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 4px 2px 18px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .mexp-title {
          margin: 0;
          font-weight: 700;
          font-size: 1.4rem;
          color: #0f172a;
        }
        .mexp-sub {
          color: #64748b;
          font-size: 0.85rem;
          margin-top: 2px;
        }
        .mexp-viewing {
          color: #0932a8;
          font-size: 0.8rem;
          font-weight: 700;
          margin-top: 6px;
        }
        .mexp-filters {
          display: flex;
          align-items: flex-end;
          gap: 12px;
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
        .mexp-select {
          border: 1px solid #e6e8ec;
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 0.85rem;
          color: #0f172a;
          background: #fff;
          height: 36px;
        }
        .months-field {
          flex-basis: 100%;
        }
        .months-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .month-chip {
          border: 1px solid #e6e8ec;
          border-radius: 999px;
          padding: 4px 12px;
          font-size: 0.78rem;
          font-weight: 600;
          background: #fff;
          color: #64748b;
          cursor: pointer;
        }
        .month-chip.active {
          background: #b45309;
          border-color: #b45309;
          color: #fff;
        }
        .mexp-apply-btn {
          height: 36px;
          padding: 0 16px;
          border: none;
          border-radius: 8px;
          background: #b45309;
          color: #fff;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
        }
        .mexp-apply-btn:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
        }
        .mexp-reset-btn {
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
        .mexp-tiles-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }
        .mexp-tile {
          background: #fff;
          border: 1px solid #e6e8ec;
          border-radius: 12px;
          padding: 16px;
        }
        .mexp-tile-label {
          color: #64748b;
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .mexp-tile-value {
          font-size: 1.4rem;
          font-weight: 700;
          color: #0f172a;
          margin-top: 6px;
        }
        .mexp-tile-note {
          font-size: 0.78rem;
          color: #94a3b8;
          margin-top: 4px;
        }
        .mexp-section {
          background: #fff;
          border: 1px solid #e6e8ec;
          border-radius: 14px;
          padding: 18px;
          height: 100%;
          margin-bottom: 18px;
        }
        .mexp-section h5 {
          margin: 0 0 12px;
          font-weight: 700;
          font-size: 1rem;
          color: #0f172a;
        }
        .mexp-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 4px;
        }
        .mexp-section-head h5 {
          margin: 0;
        }
        .mexp-export-tray {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .mexp-export-btn {
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid #e6e8ec;
          color: #334155;
          background: #fff;
        }
        .mexp-export-btn:hover {
          background: #f8fafc;
        }
        .mexp-empty {
          color: #94a3b8;
          font-size: 0.88rem;
          padding: 40px 4px;
          text-align: center;
        }
        .mexp-table-wrap {
          overflow-x: auto;
        }
        .mexp-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.88rem;
        }
        .mexp-table th {
          text-align: left;
          color: #94a3b8;
          font-weight: 600;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          padding: 6px 8px;
          border-bottom: 1px solid #f1f5f9;
          white-space: nowrap;
        }
        .mexp-table td {
          padding: 10px 8px;
          border-bottom: 1px solid #f8fafc;
          color: #334155;
          white-space: nowrap;
        }
        .mexp-table tfoot td {
          font-weight: 700;
          color: #0f172a;
          border-top: 1px solid #e6e8ec;
          border-bottom: none;
        }
      `}</style>
    </div>
  );
}
