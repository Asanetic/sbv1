import { mosySmartSelect } from '../../../apiUtils/dataControl/dataUtils';
import { processAuthToken } from '../../../auth/authManager';

// Labour cost is read from `work_schedule` — site_id is a direct
// site_list.record_id (same convention as expenses/staff/attendance_list),
// subtotal is the amount, date_ is the date column, task_description is the
// closest thing to a "category" (no dedicated column — same caveat as
// dashboard/superadmin's Cost per Category). Two pivots are built off the
// same period: site x month and task_description x month, both amount
// (subtotal) x month combined, per instruction.

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Pivots flat {keyField, label, month_num, value, txn_count} rows into one
// row per key with a `cells` array aligned to monthCols, plus a row total.
function pivotByMonth(rows, keyField, monthCols) {
  const byKey = new Map();
  for (const r of rows || []) {
    const key = r[keyField] || '';
    if (!byKey.has(key)) {
      byKey.set(key, { [keyField]: key, label: r.label, cells: {}, total: 0, txn_count: 0 });
    }
    const entry = byKey.get(key);
    const value = Number(r.value) || 0;
    const count = Number(r.txn_count) || 0;
    entry.cells[Number(r.month_num)] = value;
    entry.total += value;
    entry.txn_count += count;
  }

  const items = [...byKey.values()]
    .map((it) => ({ ...it, cells: monthCols.map((c) => it.cells[c.month] || 0) }))
    .sort((a, b) => b.total - a.total);

  const monthTotals = monthCols.map((_, colIdx) => items.reduce((sum, it) => sum + (it.cells[colIdx] || 0), 0));

  return { items, monthTotals };
}

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
  const siteFilterSite = siteId ? `AND w.site_id='${siteId}'` : '';

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
  const monthsFilterSql = months.length ? `AND MONTH(w.date_) IN (${months.join(',')})` : '';

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
      console.error('reports/labourcost query failed:', err.message, '\nSQL:', sql);
      return fallback;
    }
  }

  const [sitesList, yearsAvailable, siteGridRows, taskGridRows, totalRow] = await Promise.all([
    safeSelect(`
      SELECT record_id AS id, site_name AS name
      FROM site_list
      WHERE ${site('site_list')}
      ORDER BY site_name
    `),
    safeSelect(`
      SELECT DISTINCT YEAR(w.date_) AS year
      FROM work_schedule w
      WHERE ${site('w')} ${siteFilterSite} AND w.date_ IS NOT NULL
      ORDER BY year DESC
    `),
    safeSelect(`
      SELECT w.site_id, COALESCE(sl.site_name, NULLIF(w.site_id,''), 'Unassigned') AS label,
             MONTH(w.date_) AS month_num,
             COALESCE(SUM(w.subtotal),0) AS value, COUNT(*) AS txn_count
      FROM work_schedule w
      LEFT JOIN site_list sl ON sl.record_id = w.site_id
      WHERE ${site('w')} ${siteFilterSite}
        AND YEAR(w.date_) = ${year} ${monthsFilterSql}
      GROUP BY w.site_id, label, month_num
    `),
    safeSelect(`
      SELECT COALESCE(NULLIF(w.task_description,''),'Uncategorized') AS task_description,
             COALESCE(NULLIF(w.task_description,''),'Uncategorized') AS label,
             MONTH(w.date_) AS month_num,
             COALESCE(SUM(w.subtotal),0) AS value, COUNT(*) AS txn_count
      FROM work_schedule w
      WHERE ${site('w')} ${siteFilterSite}
        AND YEAR(w.date_) = ${year} ${monthsFilterSql}
      GROUP BY task_description, month_num
    `),
    safeSelect(`
      SELECT COALESCE(SUM(w.subtotal),0) AS value, COUNT(*) AS txn_count
      FROM work_schedule w
      WHERE ${site('w')} ${siteFilterSite}
        AND YEAR(w.date_) = ${year} ${monthsFilterSql}
    `),
  ]);

  const monthNumbers = months.length ? months : Array.from({ length: 12 }, (_, i) => i + 1);
  const monthCols = monthNumbers.map((m) => ({ month: m, label: MONTH_NAMES[m - 1] }));

  const { items: sites, monthTotals: siteMonthTotals } = pivotByMonth(siteGridRows, 'site_id', monthCols);
  const { items: tasksRaw, monthTotals: taskMonthTotals } = pivotByMonth(taskGridRows, 'task_description', monthCols);

  const totalValue = Number(totalRow?.[0]?.value || 0);
  const tasks = tasksRaw.map((t) => ({
    ...t,
    share_pct: totalValue > 0 ? Math.round((t.total / totalValue) * 1000) / 10 : 0,
  }));

  return Response.json({
    status: 'success',
    message: 'Labour cost report ready!',
    sites_list: sitesList || [],
    years: (yearsAvailable || []).map((r) => Number(r.year)).filter(Boolean),
    filters: { year, months, site_id: siteId },
    month_cols: monthCols,
    sites,
    month_totals: siteMonthTotals,
    tasks,
    task_month_totals: taskMonthTotals,
    total: {
      value: totalValue,
      txn_count: Number(totalRow?.[0]?.txn_count || 0),
    },
  });
}
