import { mosySmartSelect } from '../../../apiUtils/dataControl/dataUtils';
import { processAuthToken } from '../../../auth/authManager';

// Deposits (Money In) are M-Pesa `transactions`, not cash_deposits — same
// convention as dashboard/superadmin/route.js. `transactions` has no
// site_id column, so a site filter goes through
// site_list.account_number = transactions.BillRefNumber, and date
// filtering uses `filter_date` (not trx_date — see prior conversation).

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

  const rawSiteId = searchParams.get('site_id') || '';
  const siteId = rawSiteId.replace(/'/g, "\\'");
  const siteFilterBillRef = siteId
    ? `AND t.BillRefNumber = (SELECT account_number FROM site_list WHERE record_id='${siteId}' LIMIT 1)`
    : '';

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
  const monthsFilterSql = months.length ? `AND MONTH(t.filter_date) IN (${months.join(',')})` : '';

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
      console.error('reports/monthlydeposits query failed:', err.message, '\nSQL:', sql);
      return fallback;
    }
  }

  const [sitesList, yearsAvailable, monthlyRows, bySiteRows, totalRow] = await Promise.all([
    safeSelect(`
      SELECT record_id AS id, site_name AS name
      FROM site_list
      WHERE ${site('site_list')}
      ORDER BY site_name
    `),
    safeSelect(`
      SELECT DISTINCT YEAR(t.filter_date) AS year
      FROM transactions t
      WHERE ${site('t')} AND t.filter_date IS NOT NULL
      ORDER BY year DESC
    `),
    safeSelect(`
      SELECT MONTH(t.filter_date) AS month_num, COALESCE(SUM(t.amount),0) AS value, COUNT(*) AS txn_count
      FROM transactions t
      WHERE ${site('t')} ${siteFilterBillRef}
        AND YEAR(t.filter_date) = ${year} ${monthsFilterSql}
      GROUP BY month_num
      ORDER BY month_num
    `),
    safeSelect(`
      SELECT sl.record_id AS project_id,
             COALESCE(sl.site_name, NULLIF(t.BillRefNumber,''), 'Unassigned') AS label,
             COALESCE(SUM(t.amount),0) AS value
      FROM transactions t
      LEFT JOIN site_list sl ON sl.account_number = t.BillRefNumber
      WHERE ${site('t')} ${siteFilterBillRef}
        AND YEAR(t.filter_date) = ${year} ${monthsFilterSql}
      GROUP BY sl.record_id, label
      ORDER BY value DESC
      LIMIT 12
    `),
    safeSelect(`
      SELECT COALESCE(SUM(t.amount),0) AS value, COUNT(*) AS txn_count
      FROM transactions t
      WHERE ${site('t')} ${siteFilterBillRef}
        AND YEAR(t.filter_date) = ${year} ${monthsFilterSql}
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
    message: 'Monthly deposits report ready!',
    sites: sitesList || [],
    years: (yearsAvailable || []).map((r) => Number(r.year)).filter(Boolean),
    filters: { year, months, site_id: siteId },
    monthly,
    by_site: (bySiteRows || []).map((r) => ({ label: r.label, value: Number(r.value) || 0 })),
    total: {
      value: Number(totalRow?.[0]?.value || 0),
      txn_count: Number(totalRow?.[0]?.txn_count || 0),
    },
  });
}
