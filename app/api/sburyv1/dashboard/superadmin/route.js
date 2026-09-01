import { mosySmartSelect } from '../../../apiUtils/dataControl/dataUtils';
import { processAuthToken } from '../../../auth/authManager';

// Dumb-simple, on purpose: every query is wrapped in safeSelect() so one
// bad table/column empties that one number/chart instead of 500-ing the
// whole page.
//
// Real-data quirks this route works around (found by querying the actual
// sburyv1 DB, not just reading the schema dump):
//  - cash_deposits/custom_payments call their site reference "project_id",
//    but its value is really site_list.record_id (the two line up 1:1 in
//    real rows) — there's no separate "project" concept above a site here.
//  - expenses.quantity is blank on every row — `rate` alone is the amount.
//  - custom_payments/transactions have hive_site_id blank on 100% of real
//    rows (never backfilled), so tenant-filtered totals from them read 0
//    until that gets backfilled. Left filtered (not silently unscoped) —
//    see prior conversation.
//  - project_phases and system_users.user_role carry no per-site/status
//    data at all (phase catalog only, role always blank), so "phases" and
//    "managers" are simple counts, not active/completed or role-filtered.
//  - Money In / deposits are read from `transactions` (M-Pesa paybill
//    transactions), not cash_deposits. `transactions` has no site_id at
//    all — it's matched to a site via site_list.account_number =
//    transactions.BillRefNumber. A site filter on these queries goes
//    through that lookup.
//  - Money Out / payouts are read from `payment_receivers` (the payout
//    requests themselves — amount_to_send, project_id, time_sent), not
//    payment_confirmations (which only records the M-Pesa B2C result and
//    has no site/project column at all). Only rows with a non-blank
//    transaction_ref count as an actual payout — that's what marks a
//    payment_receivers row as having actually gone out over M-Pesa.

// Trend-chart bucketing for the *selected* period (startStr/endExclusiveStr,
// both 'YYYY-MM-DD') instead of a fixed trailing-6-months window: day
// buckets for a period of 31 days or less, calendar-month buckets for
// anything longer, so a one-week filter still shows a meaningful trend
// instead of one flat 6-month bar.
function periodSeries(startStr, endExclusiveStr) {
  const start = new Date(`${startStr}T00:00:00Z`);
  const end = new Date(`${endExclusiveStr}T00:00:00Z`);
  const spanDays = Math.round((end.getTime() - start.getTime()) / 86400000);

  if (spanDays <= 31) {
    const keys = [];
    for (let d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
      keys.push(d.toISOString().slice(0, 10));
    }
    return { keys, dateFormat: '%Y-%m-%d' };
  }

  const keys = [];
  const cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const lastMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  // end is exclusive; if it lands exactly on the 1st, the period doesn't
  // actually reach into that month.
  if (end.getUTCDate() === 1) lastMonth.setUTCMonth(lastMonth.getUTCMonth() - 1);
  while (cur <= lastMonth) {
    keys.push(`${cur.getUTCFullYear()}-${String(cur.getUTCMonth() + 1).padStart(2, '0')}`);
    cur.setUTCMonth(cur.getUTCMonth() + 1);
  }
  return { keys, dateFormat: '%Y-%m' };
}

// [start, end) for the calendar month `offset` months from now (0 = this month).
function monthRange(offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
  const toStr = (d) => d.toISOString().slice(0, 10);
  return [toStr(start), toStr(end)];
}

function pctChange(current, prev) {
  if (!prev) return 0;
  return Math.round(((current - prev) / prev) * 1000) / 10;
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
  const siteFilterProject = siteId ? `AND project_id='${siteId}'` : '';
  const siteFilterSite = siteId ? `AND site_id='${siteId}'` : '';
  // transactions has no site_id/project_id column — a site filter has to go
  // through site_list.account_number = transactions.BillRefNumber instead.
  const siteFilterBillRef = siteId
    ? `AND t.BillRefNumber = (SELECT account_number FROM site_list WHERE record_id='${siteId}' LIMIT 1)`
    : '';
  // payment_receivers has a project_id column already, same convention as
  // custom_payments — siteFilterProject covers it directly.
  const payoutSentFilter = `AND transaction_ref IS NOT NULL AND transaction_ref <> ''`;

  // Empty/null hive_site_id means a system-wide (super) owner with no
  // tenant scope — skip the tenant filter entirely and select across all
  // sites instead of filtering down to a blank/nonexistent one.
  const rawHiveSiteId = authData.hive_site_id;
  const hasTenant = rawHiveSiteId !== null && rawHiveSiteId !== undefined && String(rawHiveSiteId).trim() !== '';
  const safeHiveSiteId = hasTenant ? String(rawHiveSiteId).replace(/'/g, "\\'") : '';
  const site = (tbl) => (hasTenant ? `${tbl}.hive_site_id='${safeHiveSiteId}'` : '1=1');

  async function safeSelect(sql, fallback = []) {
    try {
      return await mosySmartSelect(sql);
    } catch (err) {
      console.error('dashboard/superadmin query failed:', err.message, '\nSQL:', sql);
      return fallback;
    }
  }

  // date_from/date_to (inclusive, YYYY-MM-DD) let the caller pick an
  // arbitrary reporting period instead of "this calendar month". The
  // comparison ("last period") is the immediately-preceding span of the
  // same length, so trend % stays meaningful for any range size.
  const isDateStr = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);
  const rawDateFrom = searchParams.get('date_from') || '';
  const rawDateTo = searchParams.get('date_to') || '';

  let thisMonthStart, thisMonthEnd, lastMonthStart, lastMonthEnd;
  if (isDateStr(rawDateFrom) && isDateStr(rawDateTo) && rawDateFrom <= rawDateTo) {
    thisMonthStart = rawDateFrom;
    const endExclusive = new Date(`${rawDateTo}T00:00:00Z`);
    endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
    thisMonthEnd = endExclusive.toISOString().slice(0, 10);

    const startDate = new Date(`${thisMonthStart}T00:00:00Z`);
    const durationMs = endExclusive.getTime() - startDate.getTime();
    const prevEndDate = startDate;
    const prevStartDate = new Date(startDate.getTime() - durationMs);
    lastMonthStart = prevStartDate.toISOString().slice(0, 10);
    lastMonthEnd = prevEndDate.toISOString().slice(0, 10);
  } else {
    [thisMonthStart, thisMonthEnd] = monthRange(0);
    [lastMonthStart, lastMonthEnd] = monthRange(-1);
  }

  const { keys: periodKeys, dateFormat: periodDateFormat } = periodSeries(thisMonthStart, thisMonthEnd);

  const [
    sitesList,
    moneyInThisMonth,
    moneyInLastMonth,
    moneyOutThisMonth,
    moneyOutLastMonth,
    expensesThisMonth,
    expensesLastMonth,
    pendingPayments,
    contractorsCount,
    staffCount,
    managersCount,
    phasesCount,
    labourCostThisMonth,
    attendanceAgg,
    costPerCategory,
    labourCostPerCategory,
    depositsPerSite,
    depositsPerMonth,
    payoutPerSite,
    payoutPerMonth,
    projectBudgets,
    projectPayouts,
    projectExpenses,
  ] = await Promise.all([
    safeSelect(`
      SELECT record_id AS id, site_name AS name
      FROM site_list
      WHERE ${site('site_list')}
      ORDER BY site_name
    `),
    safeSelect(`
      SELECT COALESCE(SUM(t.amount),0) AS value
      FROM transactions t
      WHERE ${site('t')} ${siteFilterBillRef}
        AND t.filter_date >= '${thisMonthStart}' AND t.filter_date < '${thisMonthEnd}'
    `),
    safeSelect(`
      SELECT COALESCE(SUM(t.amount),0) AS value
      FROM transactions t
      WHERE ${site('t')} ${siteFilterBillRef}
        AND t.filter_date >= '${lastMonthStart}' AND t.filter_date < '${lastMonthEnd}'
    `),
    safeSelect(`
      SELECT COALESCE(SUM(amount_to_send),0) AS value
      FROM payment_receivers
      WHERE ${site('payment_receivers')} ${siteFilterProject} ${payoutSentFilter}
        AND time_sent >= '${thisMonthStart}' AND time_sent < '${thisMonthEnd}'
    `),
    safeSelect(`
      SELECT COALESCE(SUM(amount_to_send),0) AS value
      FROM payment_receivers
      WHERE ${site('payment_receivers')} ${siteFilterProject} ${payoutSentFilter}
        AND time_sent >= '${lastMonthStart}' AND time_sent < '${lastMonthEnd}'
    `),
    safeSelect(`
      SELECT COALESCE(SUM(rate),0) AS value
      FROM expenses
      WHERE ${site('expenses')} ${siteFilterSite}
        AND expense_date >= '${thisMonthStart}' AND expense_date < '${thisMonthEnd}'
    `),
    safeSelect(`
      SELECT COALESCE(SUM(rate),0) AS value
      FROM expenses
      WHERE ${site('expenses')} ${siteFilterSite}
        AND expense_date >= '${lastMonthStart}' AND expense_date < '${lastMonthEnd}'
    `),
    safeSelect(`
      SELECT COUNT(*) AS count, COALESCE(SUM(amount_to_send),0) AS value
      FROM custom_payments
      WHERE ${site('custom_payments')} ${siteFilterProject}
        AND (status IS NULL OR LOWER(status) NOT IN ('success','sent','completed','paid'))
    `),
    // contractors has no hive_site_id column in this schema — global count.
    safeSelect(`SELECT COUNT(*) AS value FROM contractors`),
    safeSelect(`
      SELECT COUNT(*) AS value
      FROM staff
      WHERE ${site('staff')} ${siteFilterSite}
    `),
    // system_users.user_role is blank on every real row — every system
    // user is treated as a "manager" here, there's no finer role signal.
    safeSelect(`
      SELECT COUNT(*) AS value
      FROM system_users
      WHERE ${site('system_users')}
    `),
    // project_phases is a phase-name catalog with no per-site/status link
    // in this schema — a plain count, not an active/completed split.
    safeSelect(`SELECT COUNT(*) AS value FROM project_phases`),
    safeSelect(`
      SELECT COALESCE(SUM(daily_wages * day_count),0) AS value
      FROM attendance_list
      WHERE ${site('attendance_list')} ${siteFilterSite}
        AND roll_date >= '${thisMonthStart}' AND roll_date < '${thisMonthEnd}'
    `),
    // Attendance for the whole selected period, not just its latest single
    // day — days_recorded = how many distinct roll dates fall in the
    // period, present_rows = total present-marks across all of them, so
    // the tile can show a period average instead of one day's headcount.
    safeSelect(`
      SELECT COUNT(DISTINCT roll_date) AS days_recorded, COUNT(*) AS present_rows
      FROM attendance_list
      WHERE ${site('attendance_list')} ${siteFilterSite}
        AND roll_date >= '${thisMonthStart}' AND roll_date < '${thisMonthEnd}'
    `),
    safeSelect(`
      SELECT COALESCE(NULLIF(expense_category,''),'Uncategorized') AS label, COALESCE(SUM(rate),0) AS value
      FROM expenses
      WHERE ${site('expenses')} ${siteFilterSite}
        AND expense_date >= '${thisMonthStart}' AND expense_date < '${thisMonthEnd}'
      GROUP BY label
      ORDER BY value DESC
      LIMIT 6
    `),
    // work_schedule has no dedicated "category" column — task_description
    // is the closest thing, so labour cost (subtotal) is grouped by task.
    safeSelect(`
      SELECT COALESCE(NULLIF(task_description,''),'Uncategorized') AS label, COALESCE(SUM(subtotal),0) AS value
      FROM work_schedule
      WHERE ${site('work_schedule')} ${siteFilterSite}
        AND date_ >= '${thisMonthStart}' AND date_ < '${thisMonthEnd}'
      GROUP BY label
      ORDER BY value DESC
      LIMIT 6
    `),
    // Deposits per site: transactions matched to a site through
    // site_list.account_number = transactions.BillRefNumber.
    safeSelect(`
      SELECT sl.record_id AS project_id,
             COALESCE(sl.site_name, NULLIF(t.BillRefNumber,''), 'Unassigned') AS label,
             COALESCE(SUM(t.amount),0) AS value
      FROM transactions t
      LEFT JOIN site_list sl ON sl.account_number = t.BillRefNumber
      WHERE ${site('t')} ${siteFilterBillRef}
        AND t.filter_date >= '${thisMonthStart}' AND t.filter_date < '${thisMonthEnd}'
      GROUP BY sl.record_id, label
      ORDER BY value DESC
      LIMIT 8
    `),
    safeSelect(`
      SELECT DATE_FORMAT(t.filter_date,'${periodDateFormat}') AS label, COALESCE(SUM(t.amount),0) AS value
      FROM transactions t
      WHERE ${site('t')} ${siteFilterBillRef}
        AND t.filter_date >= '${thisMonthStart}' AND t.filter_date < '${thisMonthEnd}'
      GROUP BY label
    `),
    // Payout per site: payment_receivers.project_id is a site_list.record_id
    // directly — same convention as custom_payments/cash_deposits.
    safeSelect(`
      SELECT pr.project_id, COALESCE(NULLIF(pr.project_name,''), sl.site_name, NULLIF(pr.project_id,''), 'Unassigned') AS label,
             COALESCE(SUM(pr.amount_to_send),0) AS value
      FROM payment_receivers pr
      LEFT JOIN site_list sl ON sl.record_id = pr.project_id
      WHERE ${site('pr')} ${siteFilterProject.replace(/project_id/, 'pr.project_id')} AND pr.transaction_ref IS NOT NULL AND pr.transaction_ref <> ''
        AND pr.time_sent >= '${thisMonthStart}' AND pr.time_sent < '${thisMonthEnd}'
      GROUP BY pr.project_id, label
      ORDER BY value DESC
      LIMIT 8
    `),
    safeSelect(`
      SELECT DATE_FORMAT(time_sent,'${periodDateFormat}') AS label, COALESCE(SUM(amount_to_send),0) AS value
      FROM payment_receivers
      WHERE ${site('payment_receivers')} ${siteFilterProject} ${payoutSentFilter}
        AND time_sent >= '${thisMonthStart}' AND time_sent < '${thisMonthEnd}'
      GROUP BY label
    `),
    // "budget" proxy = total deposited (transactions) against the site.
    safeSelect(`
      SELECT sl.record_id AS project_id, COALESCE(SUM(t.amount),0) AS value
      FROM transactions t
      JOIN site_list sl ON sl.account_number = t.BillRefNumber
      WHERE ${site('t')}
      GROUP BY sl.record_id
    `),
    // "spent" (payouts) per site — same source as payout_per_site.
    safeSelect(`
      SELECT project_id, COALESCE(SUM(amount_to_send),0) AS value
      FROM payment_receivers
      WHERE ${site('payment_receivers')} ${payoutSentFilter}
      GROUP BY project_id
    `),
    safeSelect(`
      SELECT site_id, COALESCE(SUM(rate),0) AS value
      FROM expenses
      WHERE ${site('expenses')}
      GROUP BY site_id
    `),
  ]);

  const val = (rows) => Number(rows?.[0]?.value || 0);

  const moneyIn = val(moneyInThisMonth);
  const moneyOut = val(moneyOutThisMonth);
  const expensesTotal = val(expensesThisMonth);

  const finance = {
    money_in: moneyIn,
    money_in_trend_pct: pctChange(moneyIn, val(moneyInLastMonth)),
    money_out: moneyOut,
    money_out_trend_pct: pctChange(moneyOut, val(moneyOutLastMonth)),
    expenses: expensesTotal,
    expenses_trend_pct: pctChange(expensesTotal, val(expensesLastMonth)),
    pending_amount: Number(pendingPayments?.[0]?.value || 0),
    pending_count: Number(pendingPayments?.[0]?.count || 0),
  };

  const people = {
    contractors: val(contractorsCount),
    staff: val(staffCount),
    managers: val(managersCount),
  };

  const staffTotal = people.staff;
  const daysRecorded = Number(attendanceAgg?.[0]?.days_recorded || 0);
  const presentRows = Number(attendanceAgg?.[0]?.present_rows || 0);
  // Average headcount per recorded day across the whole period, not just
  // whatever the latest single day happened to show.
  const attendancePresentAvg = daysRecorded > 0 ? Math.round(presentRows / daysRecorded) : 0;

  const work = {
    phases_total: val(phasesCount),
    labour_cost: val(labourCostThisMonth),
    attendance_present: attendancePresentAvg,
    attendance_total: staffTotal,
    attendance_pct: staffTotal > 0 && daysRecorded > 0 ? Math.round((attendancePresentAvg / staffTotal) * 100) : 0,
    // 0 when no attendance_list row falls inside the selected period — lets
    // the UI say "no attendance recorded" instead of a misleading 0%.
    attendance_days_recorded: daysRecorded,
  };

  const performance = {
    cost_per_category: (costPerCategory || []).map((r) => ({ label: r.label, value: Number(r.value) || 0 })),
    labour_cost_per_category: (labourCostPerCategory || []).map((r) => ({ label: r.label, value: Number(r.value) || 0 })),
  };

  const toPeriodSeries = (rows) => {
    const map = Object.fromEntries((rows || []).map((r) => [r.label, Number(r.value) || 0]));
    return periodKeys.map((label) => ({ label, value: map[label] || 0 }));
  };

  const charts = {
    deposits_per_site: (depositsPerSite || []).map((r) => ({ label: r.label, value: Number(r.value) || 0 })),
    deposits_per_month: toPeriodSeries(depositsPerMonth),
    payout_per_site: (payoutPerSite || []).map((r) => ({ label: r.label, value: Number(r.value) || 0 })),
    payout_per_month: toPeriodSeries(payoutPerMonth),
  };

  const nameById = Object.fromEntries((sitesList || []).map((s) => [s.id, s.name]));
  const budgetMap = Object.fromEntries((projectBudgets || []).map((r) => [r.project_id, Number(r.value) || 0]));
  const payoutMap = Object.fromEntries((projectPayouts || []).map((r) => [r.project_id, Number(r.value) || 0]));
  const expenseMap = Object.fromEntries((projectExpenses || []).map((r) => [r.site_id, Number(r.value) || 0]));

  const projectIds = new Set([
    ...Object.keys(budgetMap),
    ...Object.keys(payoutMap),
    ...Object.keys(expenseMap),
  ]);

  const projectSummary = [...projectIds]
    .filter((id) => id && nameById[id])
    .map((id) => {
      const budget = budgetMap[id] || 0;
      const spent = (payoutMap[id] || 0) + (expenseMap[id] || 0);
      return {
        site: nameById[id],
        budget,
        spent,
        status_pct: budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0,
      };
    })
    .sort((a, b) => b.budget - a.budget)
    .slice(0, 10);

  return Response.json({
    status: 'success',
    message: 'Dashboard ready!',
    sites: sitesList || [],
    finance,
    people,
    work,
    performance,
    charts,
    project_summary: projectSummary,
  });
}
