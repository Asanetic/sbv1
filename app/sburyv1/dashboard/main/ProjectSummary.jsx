'use client';

import { fmtKES } from './dashboardFormat';

export default function ProjectSummary({ items = [] }) {
  return (
    <div className="section-block">
      <h6 className="section-title">Project Summary</h6>
      <div className="section-note">
        Budget = deposits matched by paybill account number; Spent = sent payouts (payment_receivers) plus expenses, both matched to the site.
      </div>
      <div className="dash-section">
        {items.length === 0 ? (
          <div className="dash-empty">No sites with deposits yet.</div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Site</th>
                  <th>Budget</th>
                  <th>Spent</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p, i) => (
                  <tr key={i}>
                    <td className="proj-name">{p.site}</td>
                    <td>{fmtKES(p.budget)}</td>
                    <td>{fmtKES(p.spent)}</td>
                    <td>
                      <div className="progress-wrap">
                        <div className="progress-bar-track">
                          <div className="progress-bar-fill" style={{ width: `${p.status_pct}%` }} />
                        </div>
                        <span>{p.status_pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .section-block {
          margin-bottom: 22px;
        }
        .section-title {
          margin: 0 0 10px;
          font-weight: 700;
          font-size: 0.78rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #64748b;
        }
        .section-note {
          margin: -6px 0 10px;
          font-size: 0.76rem;
          color: #94a3b8;
        }
        .dash-section {
          background: #fff;
          border: 1px solid #e6e8ec;
          border-radius: 14px;
          padding: 18px;
        }
        .dash-empty {
          color: #94a3b8;
          font-size: 0.88rem;
          padding: 18px 4px;
        }
        .dash-table-wrap {
          overflow-x: auto;
        }
        .dash-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.88rem;
        }
        .dash-table th {
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
        .dash-table td {
          padding: 12px 8px;
          border-bottom: 1px solid #f8fafc;
          color: #334155;
          white-space: nowrap;
        }
        .proj-name {
          font-weight: 600;
          color: #0f172a;
        }
        .progress-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 140px;
        }
        .progress-bar-track {
          flex: 1;
          background: #f1f5f9;
          border-radius: 6px;
          height: 8px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: #0932a8;
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
}
