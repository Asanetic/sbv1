'use client';

import ElforgeChart from '../../../components/ElforgeChart';

function ChartBox({ title, note, empty, children }) {
  return (
    <div className="col-md-6 mb-3">
      <div className="dash-section">
        <div className="dash-section-head">
          <h5>{title}</h5>
          {note && <div className="dash-section-note">{note}</div>}
        </div>
        {empty ? <div className="dash-empty">No data yet.</div> : children}
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
          margin: 0 0 8px;
          font-size: 0.76rem;
          color: #94a3b8;
        }
        .dash-empty {
          color: #94a3b8;
          font-size: 0.88rem;
          padding: 40px 4px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}

export default function AnalyticsCharts({
  depositsPerSite = [],
  depositsPerMonth = [],
  payoutPerSite = [],
  payoutPerMonth = [],
}) {
  return (
    <div className="section-block">
      <h6 className="section-title">Financial Analytics</h6>
      <div className="row m-0">
        <ChartBox
          title="Deposits per Site"
          note="M-Pesa transactions matched to a site by paybill account number."
          empty={depositsPerSite.length === 0}
        >
          <ElforgeChart
            chartType="bar"
            dataKey="label"
            data={depositsPerSite}
            series={[{ key: 'value', color: '#16a34a', name: 'Deposits' }]}
            height={260}
          />
        </ChartBox>

        <ChartBox
          title="Deposits Trend"
          note="M-Pesa deposit transactions across the selected period, by day or month depending on its length."
          empty={depositsPerMonth.length === 0}
        >
          <ElforgeChart
            chartType="area"
            dataKey="label"
            data={depositsPerMonth}
            series={[{ key: 'value', color: '#16a34a', name: 'Deposits' }]}
            height={260}
          />
        </ChartBox>

        <ChartBox
          title="Payout per Site"
          note="From payment_receivers (project_id), rows with a transaction_ref only."
          empty={payoutPerSite.length === 0}
        >
          <ElforgeChart
            chartType="bar"
            dataKey="label"
            data={payoutPerSite}
            series={[{ key: 'value', color: '#dc2626', name: 'Payout' }]}
            height={260}
          />
        </ChartBox>

        <ChartBox
          title="Payout Trend"
          note="Sent payouts (payment_receivers) across the selected period, by day or month depending on its length."
          empty={payoutPerMonth.length === 0}
        >
          <ElforgeChart
            chartType="area"
            dataKey="label"
            data={payoutPerMonth}
            series={[{ key: 'value', color: '#dc2626', name: 'Payout' }]}
            height={260}
          />
        </ChartBox>
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
