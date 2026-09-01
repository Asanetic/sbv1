import { mosySmartSelect } from '../../../apiUtils/dataControl/dataUtils';
import { processAuthToken } from '../../../auth/authManager';

// Payouts here are read from `payment_receivers` (project_id, amount_to_send,
// time_sent) — same source/convention as the dashboard's Payout per Site
// chart: project_id is already a site_list.record_id, and only rows with a
// non-blank transaction_ref count as an actual (sent) payout.

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
  const monthsFilterSql = months.length ? `AND MONTH(pr.time_sent) IN (${months.join(',')})` : '';

  const payoutSentFilter = `AND pr.transaction_ref IS NOT NULL AND pr.transaction_ref <> ''`;

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
      console.error('reports/payoutpersite query failed:', err.message, '\nSQL:', sql);
      return fallback;
    }
  }

  const [yearsAvailable, bySiteRows, monthlyRows, totalRow] = await Promise.all([
    safeSelect(`
      SELECT DISTINCT YEAR(pr.time_sent) AS year
      FROM payment_receivers pr
      WHERE ${site('pr')} AND pr.time_sent IS NOT NULL
      ORDER BY year DESC
    `),
    safeSelect(`
      SELECT pr.project_id, COALESCE(NULLIF(pr.project_name,''), sl.site_name, NULLIF(pr.project_id,''), 'Unassigned') AS label,
             COALESCE(SUM(pr.amount_to_send),0) AS value, COUNT(*) AS txn_count
      FROM payment_receivers pr
      LEFT JOIN site_list sl ON sl.record_id = pr.project_id
      WHERE ${site('pr')} ${payoutSentFilter}
        AND YEAR(pr.time_sent) = ${year} ${monthsFilterSql}
      GROUP BY pr.project_id, label
      ORDER BY value DESC
    `),
    safeSelect(`
      SELECT MONTH(pr.time_sent) AS month_num, COALESCE(SUM(pr.amount_to_send),0) AS value, COUNT(*) AS txn_count
      FROM payment_receivers pr
      WHERE ${site('pr')} ${payoutSentFilter}
        AND YEAR(pr.time_sent) = ${year} ${monthsFilterSql}
      GROUP BY month_num
      ORDER BY month_num
    `),
    safeSelect(`
      SELECT COALESCE(SUM(pr.amount_to_send),0) AS value, COUNT(*) AS txn_count
      FROM payment_receivers pr
      WHERE ${site('pr')} ${payoutSentFilter}
        AND YEAR(pr.time_sent) = ${year} ${monthsFilterSql}
    `),
  ]);

  const totalValue = Number(totalRow?.[0]?.value || 0);

  const bySite = (bySiteRows || []).map((r) => {
    const value = Number(r.value) || 0;
    return {
      project_id: r.project_id || '',
      label: r.label,
      value,
      txn_count: Number(r.txn_count) || 0,
      share_pct: totalValue > 0 ? Math.round((value / totalValue) * 1000) / 10 : 0,
    };
  });

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
    message: 'Payout per site report ready!',
    years: (yearsAvailable || []).map((r) => Number(r.year)).filter(Boolean),
    filters: { year, months },
    by_site: bySite,
    monthly,
    total: {
      value: totalValue,
      txn_count: Number(totalRow?.[0]?.txn_count || 0),
    },
  });
}
