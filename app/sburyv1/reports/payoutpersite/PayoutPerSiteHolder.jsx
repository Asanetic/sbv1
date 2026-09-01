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
  years: [],
  by_site: [],
  monthly: [],
  total: { value: 0, txn_count: 0 },
};

function defaultFilters() {
  return { year: new Date().getFullYear(), months: [] };
}

export default function PayoutPerSiteHolder() {
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(defaultFilters);

  // Draft filter state — only committed to `filters` (and fetched) on Apply.
  const [draftYear, setDraftYear] = useState(filters.year);
  const [draftMonths, setDraftMonths] = useState(filters.months);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const params = { year: String(filters.year) };
      if (filters.months.length) params.months = filters.months.join(',');

      const response = await mosyGetData({
        endpoint: apiRoutes.reports.payoutpersite,
        params,
      });

      if (response?.status === 'success') {
        setData({
          years: response?.years || [],
          by_site: response?.by_site || [],
          monthly: response?.monthly || [],
          total: response?.total || { value: 0, txn_count: 0 },
        });
        setError(null);
      } else {
        setError(response?.message || 'Failed to load payout per site report');
      }

      setLoading(false);
    }

    fetchData();
  }, [filters]);

  const dirty = draftYear !== filters.year || draftMonths.join(',') !== filters.months.join(',');
  const hasActiveFilters = filters.months.length > 0;

  function toggleMonth(m) {
    setDraftMonths((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m].sort((a, b) => a - b)));
  }

  function handleApply() {
    setFilters({ year: draftYear, months: [...draftMonths] });
  }

  function handleClear() {
    const defaults = defaultFilters();
    setDraftYear(defaults.year);
    setDraftMonths(defaults.months);
    setFilters(defaults);
  }

  const yearOptions = [...new Set([defaultFilters().year, ...data.years])].sort((a, b) => b - a);
  const monthsLabel = filters.months.length
    ? filters.months.map((m) => MONTH_NAMES[m - 1]).join(', ')
    : 'All months';

  return (
    <div className="ppst-wrapper col-md-12 p-0 m-0">
      <div className="ppst-header">
        <div>
          <h3 className="ppst-title">Payout per Site</h3>
          <div className="ppst-sub">Sent payouts (payment_receivers, transaction_ref present) broken down by site.</div>
          <div className="ppst-viewing">
            Showing {filters.year} · {monthsLabel}
          </div>
        </div>

        <div className="ppst-filters">
          <div className="filter-field">
            <label>Year</label>
            <select className="ppst-select" value={draftYear} onChange={(e) => setDraftYear(Number(e.target.value))}>
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
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

          <button type="button" className="ppst-apply-btn" disabled={!dirty} onClick={handleApply}>
            Apply
          </button>

          {hasActiveFilters && (
            <button type="button" className="ppst-reset-btn" onClick={handleClear}>
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
          <div className="ppst-tiles-row">
            <div className="ppst-tile">
              <div className="ppst-tile-label">Total Payouts</div>
              <div className="ppst-tile-value">{fmtKES(data.total.value)}</div>
              <div className="ppst-tile-note">{toNum(data.total.txn_count)} transactions · {data.by_site.length} site(s)</div>
            </div>
          </div>

          <div className="row m-0">
            <div className="col-md-6 mb-3">
              <div className="ppst-section">
                <h5>Payout per Site</h5>
                {data.by_site.length === 0 ? (
                  <div className="ppst-empty">No payouts for this selection.</div>
                ) : (
                  <ElforgeChart
                    chartType="bar"
                    dataKey="label"
                    data={data.by_site}
                    series={[{ key: 'value', color: '#dc2626', name: 'Payouts' }]}
                    height={280}
                  />
                )}
              </div>
            </div>

            <div className="col-md-6 mb-3">
              <div className="ppst-section">
                <h5>Payout Trend</h5>
                {data.monthly.every((r) => r.value === 0) ? (
                  <div className="ppst-empty">No payouts for this selection.</div>
                ) : (
                  <ElforgeChart
                    chartType="area"
                    dataKey="label"
                    data={data.monthly}
                    series={[{ key: 'value', color: '#dc2626', name: 'Payouts' }]}
                    height={280}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="ppst-section">
            <div className="ppst-section-head">
              <h5>Site Breakdown</h5>
              <div className="ppst-export-tray">
                <div
                  className="ppst-export-btn"
                  onClick={() => mosyPrintToPdf({ elemId: 'ppst_print_card', defaultTitle: 'Payout per Site Report' })}
                >
                  <i className="fa fa-print mr-1"></i> Print / PDF
                </div>
                <div
                  className="ppst-export-btn"
                  onClick={() => exportTableToExcel('ppst_data_table', `Payout per Site ${filters.year}.xlsx`)}
                >
                  <i className="fa fa-file-excel-o mr-1"></i> Export to Excel
                </div>
              </div>
            </div>
            <div className="ppst-table-wrap" id="ppst_print_card">
              <table className="ppst-table" id="ppst_data_table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Site</th>
                    <th>Payouts</th>
                    <th>Transactions</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_site.length === 0 ? (
                    <tr>
                      <td></td>
                      <td colSpan={4}>No payouts for this selection.</td>
                    </tr>
                  ) : (
                    data.by_site.map((row, i) => (
                      <tr key={row.project_id || row.label}>
                        <td>{i + 1}</td>
                        <td>{row.label}</td>
                        <td>{fmtKES(row.value)}</td>
                        <td>{toNum(row.txn_count)}</td>
                        <td>{row.share_pct}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td></td>
                    <td>Total</td>
                    <td>{fmtKES(data.total.value)}</td>
                    <td>{toNum(data.total.txn_count)}</td>
                    <td>100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .ppst-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 4px 2px 18px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .ppst-title {
          margin: 0;
          font-weight: 700;
          font-size: 1.4rem;
          color: #0f172a;
        }
        .ppst-sub {
          color: #64748b;
          font-size: 0.85rem;
          margin-top: 2px;
        }
        .ppst-viewing {
          color: #0932a8;
          font-size: 0.8rem;
          font-weight: 700;
          margin-top: 6px;
        }
        .ppst-filters {
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
        .ppst-select {
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
          background: #dc2626;
          border-color: #dc2626;
          color: #fff;
        }
        .ppst-apply-btn {
          height: 36px;
          padding: 0 16px;
          border: none;
          border-radius: 8px;
          background: #dc2626;
          color: #fff;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
        }
        .ppst-apply-btn:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
        }
        .ppst-reset-btn {
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
        .ppst-tiles-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }
        .ppst-tile {
          background: #fff;
          border: 1px solid #e6e8ec;
          border-radius: 12px;
          padding: 16px;
        }
        .ppst-tile-label {
          color: #64748b;
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .ppst-tile-value {
          font-size: 1.4rem;
          font-weight: 700;
          color: #0f172a;
          margin-top: 6px;
        }
        .ppst-tile-note {
          font-size: 0.78rem;
          color: #94a3b8;
          margin-top: 4px;
        }
        .ppst-section {
          background: #fff;
          border: 1px solid #e6e8ec;
          border-radius: 14px;
          padding: 18px;
          height: 100%;
          margin-bottom: 18px;
        }
        .ppst-section h5 {
          margin: 0 0 12px;
          font-weight: 700;
          font-size: 1rem;
          color: #0f172a;
        }
        .ppst-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 4px;
        }
        .ppst-section-head h5 {
          margin: 0;
        }
        .ppst-export-tray {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ppst-export-btn {
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid #e6e8ec;
          color: #334155;
          background: #fff;
        }
        .ppst-export-btn:hover {
          background: #f8fafc;
        }
        .ppst-empty {
          color: #94a3b8;
          font-size: 0.88rem;
          padding: 40px 4px;
          text-align: center;
        }
        .ppst-table-wrap {
          overflow-x: auto;
        }
        .ppst-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.88rem;
        }
        .ppst-table th {
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
        .ppst-table td {
          padding: 10px 8px;
          border-bottom: 1px solid #f8fafc;
          color: #334155;
          white-space: nowrap;
        }
        .ppst-table tfoot td {
          font-weight: 700;
          color: #0f172a;
          border-top: 1px solid #e6e8ec;
          border-bottom: none;
        }
      `}</style>
    </div>
  );
}
