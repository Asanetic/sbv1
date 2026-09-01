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
  monthly: [],
  by_receiver: [],
  total: { value: 0, txn_count: 0 },
};

function defaultFilters() {
  return { year: new Date().getFullYear(), months: [] };
}

export default function MonthlyPayoutsHolder() {
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
        endpoint: apiRoutes.reports.monthlypayouts,
        params,
      });

      if (response?.status === 'success') {
        setData({
          years: response?.years || [],
          monthly: response?.monthly || [],
          by_receiver: response?.by_receiver || [],
          total: response?.total || { value: 0, txn_count: 0 },
        });
        setError(null);
      } else {
        setError(response?.message || 'Failed to load monthly payouts report');
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
    <div className="mpay-wrapper col-md-12 p-0 m-0">
      <div className="mpay-header">
        <div>
          <h3 className="mpay-title">Monthly Payouts</h3>
          <div className="mpay-sub">M-Pesa payout confirmations (payment_confirmations) — tenant-wide, not site-filterable.</div>
          <div className="mpay-viewing">
            Showing {filters.year} · {monthsLabel}
          </div>
        </div>

        <div className="mpay-filters">
          <div className="filter-field">
            <label>Year</label>
            <select className="mpay-select" value={draftYear} onChange={(e) => setDraftYear(Number(e.target.value))}>
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

          <button type="button" className="mpay-apply-btn" disabled={!dirty} onClick={handleApply}>
            Apply
          </button>

          {hasActiveFilters && (
            <button type="button" className="mpay-reset-btn" onClick={handleClear}>
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
          <div className="mpay-tiles-row">
            <div className="mpay-tile">
              <div className="mpay-tile-label">Total Payouts</div>
              <div className="mpay-tile-value">{fmtKES(data.total.value)}</div>
              <div className="mpay-tile-note">{toNum(data.total.txn_count)} transactions</div>
            </div>
          </div>

          <div className="row m-0">
            <div className="col-md-6 mb-3">
              <div className="mpay-section">
                <h5>Payouts by Month</h5>
                {data.monthly.every((r) => r.value === 0) ? (
                  <div className="mpay-empty">No payouts for this selection.</div>
                ) : (
                  <ElforgeChart
                    chartType="area"
                    dataKey="label"
                    data={data.monthly}
                    series={[{ key: 'value', color: '#dc2626', name: 'Payouts' }]}
                    height={260}
                  />
                )}
              </div>
            </div>

            <div className="col-md-6 mb-3">
              <div className="mpay-section">
                <h5>Payouts by Receiver</h5>
                {data.by_receiver.length === 0 ? (
                  <div className="mpay-empty">No payouts for this selection.</div>
                ) : (
                  <ElforgeChart
                    chartType="bar"
                    dataKey="label"
                    data={data.by_receiver}
                    series={[{ key: 'value', color: '#dc2626', name: 'Payouts' }]}
                    height={260}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="mpay-section">
            <div className="mpay-section-head">
              <h5>Monthly Breakdown</h5>
              <div className="mpay-export-tray">
                <div
                  className="mpay-export-btn"
                  onClick={() => mosyPrintToPdf({ elemId: 'mpay_print_card', defaultTitle: 'Monthly Payouts Report' })}
                >
                  <i className="fa fa-print mr-1"></i> Print / PDF
                </div>
                <div
                  className="mpay-export-btn"
                  onClick={() => exportTableToExcel('mpay_data_table', `Monthly Payouts ${filters.year}.xlsx`)}
                >
                  <i className="fa fa-file-excel-o mr-1"></i> Export to Excel
                </div>
              </div>
            </div>
            <div className="mpay-table-wrap" id="mpay_print_card">
              <table className="mpay-table" id="mpay_data_table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Month</th>
                    <th>Payouts</th>
                    <th>Transactions</th>
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
        .mpay-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 4px 2px 18px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .mpay-title {
          margin: 0;
          font-weight: 700;
          font-size: 1.4rem;
          color: #0f172a;
        }
        .mpay-sub {
          color: #64748b;
          font-size: 0.85rem;
          margin-top: 2px;
        }
        .mpay-viewing {
          color: #0932a8;
          font-size: 0.8rem;
          font-weight: 700;
          margin-top: 6px;
        }
        .mpay-filters {
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
        .mpay-select {
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
        .mpay-apply-btn {
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
        .mpay-apply-btn:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
        }
        .mpay-reset-btn {
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
        .mpay-tiles-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }
        .mpay-tile {
          background: #fff;
          border: 1px solid #e6e8ec;
          border-radius: 12px;
          padding: 16px;
        }
        .mpay-tile-label {
          color: #64748b;
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .mpay-tile-value {
          font-size: 1.4rem;
          font-weight: 700;
          color: #0f172a;
          margin-top: 6px;
        }
        .mpay-tile-note {
          font-size: 0.78rem;
          color: #94a3b8;
          margin-top: 4px;
        }
        .mpay-section {
          background: #fff;
          border: 1px solid #e6e8ec;
          border-radius: 14px;
          padding: 18px;
          height: 100%;
          margin-bottom: 18px;
        }
        .mpay-section h5 {
          margin: 0 0 12px;
          font-weight: 700;
          font-size: 1rem;
          color: #0f172a;
        }
        .mpay-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 4px;
        }
        .mpay-section-head h5 {
          margin: 0;
        }
        .mpay-export-tray {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .mpay-export-btn {
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid #e6e8ec;
          color: #334155;
          background: #fff;
        }
        .mpay-export-btn:hover {
          background: #f8fafc;
        }
        .mpay-empty {
          color: #94a3b8;
          font-size: 0.88rem;
          padding: 40px 4px;
          text-align: center;
        }
        .mpay-table-wrap {
          overflow-x: auto;
        }
        .mpay-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.88rem;
        }
        .mpay-table th {
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
        .mpay-table td {
          padding: 10px 8px;
          border-bottom: 1px solid #f8fafc;
          color: #334155;
          white-space: nowrap;
        }
        .mpay-table tfoot td {
          font-weight: 700;
          color: #0f172a;
          border-top: 1px solid #e6e8ec;
          border-bottom: none;
        }
      `}</style>
    </div>
  );
}
