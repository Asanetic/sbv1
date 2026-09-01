'use client';

import { fmtKES } from './dashboardFormat';

function CategoryBox({ title, note, items, emptyText, barColor }) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className="col-md-6 mb-3">
      <div className="dash-section">
        <div className="dash-section-head">
          <h5>{title}</h5>
          {note && <div className="dash-section-note">{note}</div>}
        </div>

        {items.length === 0 ? (
          <div className="dash-empty">{emptyText}</div>
        ) : (
          <div className="bar-list">
            {items.map((item, i) => (
              <div className="bar-row" key={i}>
                <div className="bar-label">{item.label}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(item.value / max) * 100}%`, background: barColor }} />
                </div>
                <div className="bar-value">{fmtKES(item.value)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .dash-section {
          background: #fff;
          border: 1px solid #e6e8ec;
          border-radius: 14px;
          padding: 18px;
          height: 100%;
        }
        .dash-section-head h5 {
          margin: 0 0 4px;
          font-weight: 700;
          font-size: 1rem;
          color: #0f172a;
        }
        .dash-section-note {
          margin: 0 0 12px;
          font-size: 0.76rem;
          color: #94a3b8;
        }
        .dash-empty {
          color: #94a3b8;
          font-size: 0.88rem;
          padding: 18px 4px;
        }
        .bar-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .bar-row {
          display: grid;
          grid-template-columns: 120px 1fr 90px;
          align-items: center;
          gap: 12px;
        }
        .bar-label {
          font-size: 0.85rem;
          color: #334155;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .bar-track {
          background: #f1f5f9;
          border-radius: 6px;
          height: 10px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          border-radius: 6px;
        }
        .bar-value {
          font-size: 0.82rem;
          font-weight: 600;
          color: #0f172a;
          text-align: right;
        }
      `}</style>
    </div>
  );
}

export default function CostPerCategory({ items = [], labourItems = [] }) {
  return (
    <div className="section-block">
      <h6 className="section-title">Performance</h6>
      <div className="row m-0">
        <CategoryBox
          title="Expenses by Category"
          note="Expenses grouped by category for the selected period."
          items={items}
          emptyText="No expenses yet."
          barColor="#0932a8"
        />
        <CategoryBox
          title="Labour by Category"
          note="Labour cost by task from the work schedule, for the selected period."
          items={labourItems}
          emptyText="No labour cost recorded yet."
          barColor="#dc2626"
        />
      </div>

      <style jsx>{`
        .section-block {
          margin-bottom: 8px;
        }
        .section-title {
          margin: 0 0 10px;
          font-weight: 700;
          font-size: 0.78rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #64748b;
        }
      `}</style>
    </div>
  );
}
