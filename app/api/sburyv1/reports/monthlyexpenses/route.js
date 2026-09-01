import { mosySmartSelect } from '../../../apiUtils/dataControl/dataUtils';
import { processAuthToken } from '../../../auth/authManager';

// Expenses have a direct site_id column (a site_list.record_id, same
// convention as staff/attendance_list) — no BillRefNumber-style lookup
// needed, unlike transactions/payment_receivers. rate is the amount
// (expenses.quantity is blank on every real row — see dashboard/superadmin
// route.js comment), expense_date is the date column.

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
  const siteFilterSite = siteId ? `AND site_id='${siteId}'` : '';

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
  const monthsFilterSql = months.length ? `AND MONTH(e.expense_date) IN (${months.join(',')})` : '';

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
      console.error('reports/monthlyexpenses query failed:', err.message, '\nSQL:', sql);
      return fallback;
    }
  }

  const [sitesList, yearsAvailable, monthlyRows, bySiteRows, byCategoryRows, totalRow] = await Promise.all([
    safeSelect(`
      SELECT record_id AS id, site_name AS name
      FROM site_list
      WHERE ${site('site_list')}
      ORDER BY site_name
    `),
    safeSelect(`
      SELECT DISTINCT YEAR(e.expense_date) AS year
      FROM expenses e
      WHERE ${site('e')} AND e.expense_date IS NOT NULL
      ORDER BY year DESC
    `),
    safeSelect(`
      SELECT MONTH(e.expense_date) AS month_num, COALESCE(SUM(e.rate),0) AS value, COUNT(*) AS txn_count
      FROM expenses e
      WHERE ${site('e')} ${siteFilterSite}
        AND YEAR(e.expense_date) = ${year} ${monthsFilterSql}
      GROUP BY month_num
      ORDER BY month_num
    `),
    safeSelect(`
      SELECT e.site_id, COALESCE(sl.site_name, NULLIF(e.site_id,''), 'Unassigned') AS label,
             COALESCE(SUM(e.rate),0) AS value
      FROM expenses e
      LEFT JOIN site_list sl ON sl.record_id = e.site_id
      WHERE ${site('e')} ${siteFilterSite}
        AND YEAR(e.expense_date) = ${year} ${monthsFilterSql}
      GROUP BY e.site_id, label
      ORDER BY value DESC
      LIMIT 12
    `),
    safeSelect(`
      SELECT COALESCE(NULLIF(e.expense_category,''),'Uncategorized') AS label, COALESCE(SUM(e.rate),0) AS value
      FROM expenses e
      WHERE ${site('e')} ${siteFilterSite}
        AND YEAR(e.expense_date) = ${year} ${monthsFilterSql}
      GROUP BY label
      ORDER BY value DESC
      LIMIT 12
    `),
    safeSelect(`
      SELECT COALESCE(SUM(e.rate),0) AS value, COUNT(*) AS txn_count
      FROM expenses e
      WHERE ${site('e')} ${siteFilterSite}
        AND YEAR(e.expense_date) = ${year} ${monthsFilterSql}
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
    message: 'Monthly expenses report ready!',
    sites: sitesList || [],
    years: (yearsAvailable || []).map((r) => Number(r.year)).filter(Boolean),
    filters: { year, months, site_id: siteId },
    monthly,
    by_site: (bySiteRows || []).map((r) => ({ label: r.label, value: Number(r.value) || 0 })),
    by_category: (byCategoryRows || []).map((r) => ({ label: r.label, value: Number(r.value) || 0 })),
    total: {
      value: Number(totalRow?.[0]?.value || 0),
      txn_count: Number(totalRow?.[0]?.txn_count || 0),
    },
  });
}
