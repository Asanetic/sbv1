import { mosySmartSelect } from '../../../apiUtils/dataControl/dataUtils';
import { processAuthToken } from '../../../auth/authManager';

// Payouts here are read from `payment_confirmations` (M-Pesa B2C payout
// results) — transaction_amount / transaction_date_time / receiver_public_name.
// Unlike the dashboard's Money Out / Payout charts (which go through
// payment_receivers.transaction_ref to pick up a site), this report reads
// payment_confirmations directly, per instruction — so it has no site
// filter, only a tenant scope (hive_site_id) plus year/months.

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export async function GET(request) {
  const { valid: isTokenValid, reason: tokenError, data: authData } =
    processAuthToken(request);

  if (!isTokenValid) {
    return Response.json(
      { status: 'unauthorized', message: tokenError },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);

  const currentYear = new Date().getFullYear();
  const rawYear = parseInt(searchParams.get('year'), 10);
  const year = Number.isInteger(rawYear) && rawYear >= 2000 && rawYear <= 2100 ? rawYear : currentYear;

  // months=1,3,7 — only include those calendar months in the report.
  // Missing/empty/invalid -> all 12 months of the selected year.
  const rawMonths = (searchParams.get('months') || '')
    .split(',')
    .map((m) => parseInt(m, 10))
    .filter((m) => Number.isInteger(m) && m >= 1 && m <= 12);
  const months = [...new Set(rawMonths)].sort((a, b) => a - b);
  const monthsFilterSql = months.length ? `AND MONTH(pc.transaction_date_time) IN (${months.join(',')})` : '';

  // Empty/null hive_site_id means a system-wide (super) owner — same
  // tenant-bypass convention as dashboard/superadmin/route.js.
  const rawHiveSiteId = authData.hive_site_id;
  const hasTenant = rawHiveSiteId !== null && rawHiveSiteId !== undefined && String(rawHiveSiteId).trim() !== '';
  const safeHiveSiteId = hasTenant ? String(rawHiveSiteId).replace(/'/g, "\\'") : '';
  const site = (tbl) => (hasTenant ? `${tbl}.hive_site_id='${safeHiveSiteId}'` : '1=1');

  async function safeSelect(sql, fallback = []) {
    try {
      return await mosySmartSelect(sql);
    } catch (err) {
      console.error('reports/monthlypayouts query failed:', err.message, '\nSQL:', sql);
      return fallback;
    }
  }

  const [yearsAvailable, monthlyRows, byReceiverRows, totalRow] = await Promise.all([
    safeSelect(`
      SELECT DISTINCT YEAR(pc.transaction_date_time) AS year
      FROM payment_confirmations pc
      WHERE ${site('pc')} AND pc.transaction_date_time IS NOT NULL
      ORDER BY year DESC
    `),
    safeSelect(`
      SELECT MONTH(pc.transaction_date_time) AS month_num, COALESCE(SUM(pc.transaction_amount),0) AS value, COUNT(*) AS txn_count
      FROM payment_confirmations pc
      WHERE ${site('pc')}
        AND YEAR(pc.transaction_date_time) = ${year} ${monthsFilterSql}
      GROUP BY month_num
      ORDER BY month_num
    `),
    safeSelect(`
      SELECT COALESCE(NULLIF(pc.receiver_public_name,''), 'Unknown') AS label, COALESCE(SUM(pc.transaction_amount),0) AS value
      FROM payment_confirmations pc
      WHERE ${site('pc')}
        AND YEAR(pc.transaction_date_time) = ${year} ${monthsFilterSql}
      GROUP BY label
      ORDER BY value DESC
      LIMIT 12
    `),
    safeSelect(`
      SELECT COALESCE(SUM(pc.transaction_amount),0) AS value, COUNT(*) AS txn_count
      FROM payment_confirmations pc
      WHERE ${site('pc')}
        AND YEAR(pc.transaction_date_time) = ${year} ${monthsFilterSql}
    `),
  ]);

  const byMonthNum = Object.fromEntries(
    (monthlyRows || []).map((r) => [Number(r.month_num), { value: Number(r.value) || 0, txn_count: Number(r.txn_count) || 0 }])
  );

  const monthNumbers = months.length ? months : Array.from({ length: 12 }, (_, i) => i + 1);
  const monthly = monthNumbers.map((m) => ({
    month: m,
    label: MONTH_NAMES[m - 1],
    value: byMonthNum[m]?.value || 0,
    txn_count: byMonthNum[m]?.txn_count || 0,
  }));

  return Response.json({
    status: 'success',
    message: 'Monthly payouts report ready!',
    years: (yearsAvailable || []).map((r) => Number(r.year)).filter(Boolean),
    filters: { year, months },
    monthly,
    by_receiver: (byReceiverRows || []).map((r) => ({ label: r.label, value: Number(r.value) || 0 })),
    total: {
      value: Number(totalRow?.[0]?.value || 0),
      txn_count: Number(totalRow?.[0]?.txn_count || 0),
    },
  });
}
