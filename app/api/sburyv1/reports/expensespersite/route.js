import { mosySmartSelect } from '../../../apiUtils/dataControl/dataUtils';
import { processAuthToken } from '../../../auth/authManager';

// Expenses have a direct site_id column (a site_list.record_id) — same
// convention as reports/monthlyexpenses. rate is the amount (quantity is
// blank on every real row), expense_date is the date column.

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
      console.error('reports/expensespersite query failed:', err.message, '\nSQL:', sql);
      return fallback;
    }
  }

  const [yearsAvailable, bySiteRows, monthlyRows, totalRow] = await Promise.all([
    safeSelect(`
      SELECT DISTINCT YEAR(e.expense_date) AS year
      FROM expenses e
      WHERE ${site('e')} AND e.expense_date IS NOT NULL
      ORDER BY year DESC
    `),
    safeSelect(`
      SELECT e.site_id, COALESCE(sl.site_name, NULLIF(e.site_id,''), 'Unassigned') AS label,
             COALESCE(SUM(e.rate),0) AS value, COUNT(*) AS txn_count
      FROM expenses e
      LEFT JOIN site_list sl ON sl.record_id = e.site_id
      WHERE ${site('e')}
        AND YEAR(e.expense_date) = ${year} ${monthsFilterSql}
      GROUP BY e.site_id, label
      ORDER BY value DESC
    `),
    safeSelect(`
      SELECT MONTH(e.expense_date) AS month_num, COALESCE(SUM(e.rate),0) AS value, COUNT(*) AS txn_count
      FROM expenses e
      WHERE ${site('e')}
        AND YEAR(e.expense_date) = ${year} ${monthsFilterSql}
      GROUP BY month_num
      ORDER BY month_num
    `),
    safeSelect(`
      SELECT COALESCE(SUM(e.rate),0) AS value, COUNT(*) AS txn_count
      FROM expenses e
      WHERE ${site('e')}
        AND YEAR(e.expense_date) = ${year} ${monthsFilterSql}
    `),
  ]);

  const totalValue = Number(totalRow?.[0]?.value || 0);

  const bySite = (bySiteRows || []).map((r) => {
    const value = Number(r.value) || 0;
    return {
      site_id: r.site_id || '',
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
    message: 'Expenses per site report ready!',
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
