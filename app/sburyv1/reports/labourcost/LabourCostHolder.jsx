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
  month_cols: [],
  sites: [],
  month_totals: [],
  tasks: [],
  task_month_totals: [],
  total: { value: 0, txn_count: 0 },
};

function defaultFilters() {
  return { year: new Date().getFullYear(), months: [] };
}

export default function LabourCostHolder() {
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
        endpoint: apiRoutes.reports.labourcost,
        params,
      });

      if (response?.status === 'success') {
        setData({
          years: response?.years || [],
          month_cols: response?.month_cols || [],
          sites: response?.sites || [],
          month_totals: response?.month_totals || [],
          tasks: response?.tasks || [],
          task_month_totals: response?.task_month_totals || [],
          total: response?.total || { value: 0, txn_count: 0 },
        });
        setError(null);
      } else {
        setError(response?.message || 'Failed to load labour cost report');
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

  const bySiteChart = data.sites.map((s) => ({ label: s.label, value: s.total }));
  const byMonthChart = data.month_cols.map((c, i) => ({ label: c.label, value: data.month_totals[i] || 0 }));

  return (
    <div className="lcst-wrapper col-md-12 p-0 m-0">
      <div className="lcst-header">
        <div>
          <h3 className="lcst-title">Labour Cost</h3>
          <div className="lcst-sub">Work schedule cost (work_schedule.subtotal), by site and by task, each combined with month.</div>
          <div className="lcst-viewing">
            Showing {filters.year} · {monthsLabel}
          </div>
        </div>

        <div className="lcst-filters">
          <div className="filter-field">
            <label>Year</label>
            <select className="lcst-select" value={draftYear} onChange={(e) => setDraftYear(Number(e.target.value))}>
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

          <button type="button" className="lcst-apply-btn" disabled={!dirty} onClick={handleApply}>
            Apply
          </button>

          {hasActiveFilters && (
            <button type="button" className="lcst-reset-btn" onClick={handleClear}>
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
          <div className="lcst-tiles-row">
            <div className="lcst-tile">
              <div className="lcst-tile-label">Total Labour Cost</div>
              <div className="lcst-tile-value">{fmtKES(data.total.value)}</div>
              <div className="lcst-tile-note">{toNum(data.total.txn_count)} entries · {data.sites.length} site(s)</div>
            </div>
          </div>

          <div className="row m-0">
            <div className="col-md-6 mb-3">
              <div className="lcst-section">
                <h5>Labour Cost per Site</h5>
                {bySiteChart.length === 0 ? (
                  <div className="lcst-empty">No labour cost for this selection.</div>
                ) : (
                  <ElforgeChart
                    chartType="bar"
                    dataKey="label"
                    data={bySiteChart}
                    series={[{ key: 'value', color: '#0f766e', name: 'Labour cost' }]}
                    height={280}
                  />
                )}
              </div>
            </div>

            <div className="col-md-6 mb-3">
              <div className="lcst-section">
                <h5>Labour Cost Trend</h5>
                {byMonthChart.every((r) => r.value === 0) ? (
                  <div className="lcst-empty">No labour cost for this selection.</div>
                ) : (
                  <ElforgeChart
                    chartType="area"
                    dataKey="label"
                    data={byMonthChart}
                    series={[{ key: 'value', color: '#0f766e', name: 'Labour cost' }]}
                    height={280}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="lcst-section">
            <div className="lcst-section-head">
              <h5>Site × Month Breakdown</h5>
              <div className="lcst-export-tray">
                <div
                  className="lcst-export-btn"
                  onClick={() => mosyPrintToPdf({ elemId: 'lcst_print_card', defaultTitle: 'Labour Cost Report' })}
                >
                  <i className="fa fa-print mr-1"></i> Print / PDF
                </div>
                <div
                  className="lcst-export-btn"
                  onClick={() => exportTableToExcel('lcst_data_table', `Labour Cost ${filters.year}.xlsx`)}
                >
                  <i className="fa fa-file-excel-o mr-1"></i> Export to Excel
                </div>
              </div>
            </div>
            <div className="lcst-table-wrap" id="lcst_print_card">
              <table className="lcst-table" id="lcst_data_table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Site</th>
                    {data.month_cols.map((c) => (
                      <th key={c.month}>{c.label}</th>
                    ))}
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sites.length === 0 ? (
                    <tr>
                      <td></td>
                      <td colSpan={data.month_cols.length + 2}>No labour cost for this selection.</td>
                    </tr>
                  ) : (
                    data.sites.map((s, i) => (
                      <tr key={s.site_id || s.label}>
                        <td>{i + 1}</td>
                        <td>{s.label}</td>
                        {s.cells.map((v, ci) => (
                          <td key={ci}>{fmtKES(v)}</td>
                        ))}
                        <td className="lcst-row-total">{fmtKES(s.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td></td>
                    <td>Total</td>
                    {data.month_totals.map((v, i) => (
                      <td key={i}>{fmtKES(v)}</td>
                    ))}
                    <td>{fmtKES(data.total.value)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="lcst-section">
            <div className="lcst-section-head">
              <h5>Task × Month Breakdown</h5>
              <div className="lcst-export-tray">
                <div
                  className="lcst-export-btn"
                  onClick={() => mosyPrintToPdf({ elemId: 'lcst_task_print_card', defaultTitle: 'Labour Cost by Task Report' })}
                >
                  <i className="fa fa-print mr-1"></i> Print / PDF
                </div>
                <div
                  className="lcst-export-btn"
                  onClick={() => exportTableToExcel('lcst_task_data_table', `Labour Cost by Task ${filters.year}.xlsx`)}
                >
                  <i className="fa fa-file-excel-o mr-1"></i> Export to Excel
                </div>
              </div>
            </div>
            <div className="lcst-table-wrap" id="lcst_task_print_card">
              <table className="lcst-table" id="lcst_task_data_table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Task</th>
                    {data.month_cols.map((c) => (
                      <th key={c.month}>{c.label}</th>
                    ))}
                    <th>Total</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tasks.length === 0 ? (
                    <tr>
                      <td></td>
                      <td colSpan={data.month_cols.length + 3}>No labour cost for this selection.</td>
                    </tr>
                  ) : (
                    data.tasks.map((t, i) => (
                      <tr key={t.task_description || t.label}>
                        <td>{i + 1}</td>
                        <td>{t.label}</td>
                        {t.cells.map((v, ci) => (
                          <td key={ci}>{fmtKES(v)}</td>
                        ))}
                        <td className="lcst-row-total">{fmtKES(t.total)}</td>
                        <td>{t.share_pct}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td></td>
                    <td>Total</td>
                    {data.task_month_totals.map((v, i) => (
                      <td key={i}>{fmtKES(v)}</td>
                    ))}
                    <td>{fmtKES(data.total.value)}</td>
                    <td>100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .lcst-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 4px 2px 18px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .lcst-title {
          margin: 0;
          font-weight: 700;
          font-size: 1.4rem;
          color: #0f172a;
        }
        .lcst-sub {
          color: #64748b;
          font-size: 0.85rem;
          margin-top: 2px;
        }
        .lcst-viewing {
          color: #0932a8;
          font-size: 0.8rem;
          font-weight: 700;
          margin-top: 6px;
        }
        .lcst-filters {
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
        .lcst-select {
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
          background: #0f766e;
          border-color: #0f766e;
          color: #fff;
        }
        .lcst-apply-btn {
          height: 36px;
          padding: 0 16px;
          border: none;
          border-radius: 8px;
          background: #0f766e;
          color: #fff;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
        }
        .lcst-apply-btn:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
        }
        .lcst-reset-btn {
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
        .lcst-tiles-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }
        .lcst-tile {
          background: #fff;
          border: 1px solid #e6e8ec;
          border-radius: 12px;
          padding: 16px;
        }
        .lcst-tile-label {
          color: #64748b;
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .lcst-tile-value {
          font-size: 1.4rem;
          font-weight: 700;
          color: #0f172a;
          margin-top: 6px;
        }
        .lcst-tile-note {
          font-size: 0.78rem;
          color: #94a3b8;
          margin-top: 4px;
        }
        .lcst-section {
          background: #fff;
          border: 1px solid #e6e8ec;
          border-radius: 14px;
          padding: 18px;
          height: 100%;
          margin-bottom: 18px;
        }
        .lcst-section h5 {
          margin: 0 0 12px;
          font-weight: 700;
          font-size: 1rem;
          color: #0f172a;
        }
        .lcst-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 4px;
        }
        .lcst-section-head h5 {
          margin: 0;
        }
        .lcst-export-tray {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .lcst-export-btn {
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid #e6e8ec;
          color: #334155;
          background: #fff;
        }
        .lcst-export-btn:hover {
          background: #f8fafc;
        }
        .lcst-empty {
          color: #94a3b8;
          font-size: 0.88rem;
          padding: 40px 4px;
          text-align: center;
        }
        .lcst-table-wrap {
          overflow-x: auto;
        }
        .lcst-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        .lcst-table th {
          text-align: left;
          color: #94a3b8;
          font-weight: 600;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          padding: 6px 8px;
          border-bottom: 1px solid #f1f5f9;
          white-space: nowrap;
        }
        .lcst-table td {
          padding: 10px 8px;
          border-bottom: 1px solid #f8fafc;
          color: #334155;
          white-space: nowrap;
        }
        .lcst-row-total {
          font-weight: 700;
          color: #0f172a;
        }
        .lcst-table tfoot td {
          font-weight: 700;
          color: #0f172a;
          border-top: 1px solid #e6e8ec;
          border-bottom: none;
        }
      `}</style>
    </div>
  );
}
