import { mosySmartSelect, toNum } from '../../../apiUtils/dataControl/dataUtils';
import { processAuthToken } from '../../../auth/authManager';

// Deliberately dumb-simple, on purpose — 10 plain numbers, 4 plain "by
// month/client" charts, one follow-up history list. No pipelines, no
// "today's actions", nothing clever. Every query is wrapped in
// safeSelect() so one bad table/column empties that one number/chart
// instead of 500-ing the whole page.

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function last6MonthKeys() {
  const keys = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    keys.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  return keys;
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

  const safeHiveSiteId = String(authData.hive_site_id).replace(/'/g, "\\'");
  const site = (tbl) => `${tbl}.hive_site_id='${safeHiveSiteId}'`;

  async function safeSelect(sql, fallback = []) {
    try {
      return await mosySmartSelect(sql);
    } catch (err) {
      console.error('dashboard/admin query failed:', err.message, '\nSQL:', sql);
      return fallback;
    }
  }

  const sixAgo = new Date();
  sixAgo.setMonth(sixAgo.getMonth() - 5);
  sixAgo.setDate(1);
  const sixAgoStr = sixAgo.toISOString().slice(0, 10);

  const [
    paid,
    expectedNotPaid,
    clientsCount,
    projectsCount,
    projectValueTotal,
    completeProjectValue,
    pendingProjectValue,
    paymentByClient,
    paymentByMonth,
    expectedByMonth,
    callsByMonth,
    messagesByMonth,
    followUpHistory,
  ] = await Promise.all([
    safeSelect(`
      SELECT COALESCE(SUM(amount_paid),0) AS value
      FROM smart_payments
      WHERE ${site('smart_payments')}
    `),
    safeSelect(`
      SELECT COALESCE(SUM(expected_amount),0) AS value
      FROM expected_revenue
      WHERE ${site('expected_revenue')} AND (payment_status IS NULL OR payment_status <> 'Paid')
    `),
    safeSelect(`
      SELECT COUNT(*) AS value
      FROM contacts
      WHERE ${site('contacts')}
    `),
    safeSelect(`
      SELECT COUNT(*) AS value
      FROM opportunities
      WHERE ${site('opportunities')}
    `),
    safeSelect(`
      SELECT COALESCE(SUM(amount),0) AS value
      FROM opportunities
      WHERE ${site('opportunities')}
    `),
    safeSelect(`
      SELECT COALESCE(SUM(amount),0) AS value
      FROM opportunities
      WHERE ${site('opportunities')} AND stage = 'Closed Won'
    `),
    safeSelect(`
      SELECT COALESCE(SUM(amount),0) AS value
      FROM opportunities
      WHERE ${site('opportunities')} AND stage NOT IN ('Closed Won','Closed Lost')
    `),
    safeSelect(`
      SELECT payer_name AS label, COALESCE(SUM(amount_paid),0) AS value
      FROM smart_payments
      WHERE ${site('smart_payments')} AND payer_name IS NOT NULL AND payer_name <> ''
      GROUP BY payer_name
      ORDER BY value DESC
      LIMIT 8
    `),
    safeSelect(`
      SELECT DATE_FORMAT(payment_date,'%Y-%m') AS label, COALESCE(SUM(amount_paid),0) AS value
      FROM smart_payments
      WHERE ${site('smart_payments')} AND payment_date >= '${sixAgoStr}'
      GROUP BY label
    `),
    safeSelect(`
      SELECT DATE_FORMAT(expected_close_date,'%Y-%m') AS label, COALESCE(SUM(expected_amount),0) AS value
      FROM expected_revenue
      WHERE ${site('expected_revenue')} AND expected_close_date >= '${sixAgoStr}'
      GROUP BY label
    `),
    safeSelect(`
      SELECT DATE_FORMAT(initiated_on,'%Y-%m') AS label, COUNT(*) AS value
      FROM smart_calls
      WHERE ${site('smart_calls')} AND initiated_on >= '${sixAgoStr}'
      GROUP BY label
    `),
    safeSelect(`
      SELECT DATE_FORMAT(sent_on,'%Y-%m') AS label, COUNT(*) AS value
      FROM smart_messages
      WHERE ${site('smart_messages')} AND sent_on >= '${sixAgoStr}'
      GROUP BY label
    `),
    safeSelect(`
      SELECT contact_name, title, activity_date, venue, agenda, outcome, status
      FROM activities
      WHERE ${site('activities')} AND LOWER(type) = 'follow up'
      ORDER BY activity_date DESC
      LIMIT 10
    `),
  ]);

  const val = (rows) => Number(rows?.[0]?.value || 0);

  const cards = [
    { key: 'paid', label: 'Paid', value: toNum(val(paid), 0) },
    { key: 'expected_not_paid', label: 'Expected — Not Paid', value: toNum(val(expectedNotPaid), 0) },
    { key: 'clients', label: 'Clients', value: toNum(val(clientsCount), 0) },
    { key: 'projects', label: 'Projects', value: toNum(val(projectsCount), 0) },
    { key: 'project_value_total', label: 'Project Value — Total', value: toNum(val(projectValueTotal), 0) },
    { key: 'complete_project_value', label: 'Project Value — Complete', value: toNum(val(completeProjectValue), 0) },
    { key: 'pending_project_value', label: 'Project Value — Pending', value: toNum(val(pendingProjectValue), 0) },
  ];

  const months = last6MonthKeys();
  const toMonthSeries = (rows) => {
    const map = Object.fromEntries((rows || []).map((r) => [r.label, Number(r.value) || 0]));
    return months.map((label) => ({ label, value: map[label] || 0 }));
  };

  const callsMap = Object.fromEntries((callsByMonth || []).map((r) => [r.label, Number(r.value) || 0]));
  const messagesMap = Object.fromEntries((messagesByMonth || []).map((r) => [r.label, Number(r.value) || 0]));
  const callsMessagesByMonth = months.map((label) => ({
    label,
    calls: callsMap[label] || 0,
    messages: messagesMap[label] || 0,
  }));

  return Response.json({
    status: 'success',
    message: 'Dashboard ready!',
    cards,
    payment_by_client: (paymentByClient || []).map((r) => ({ label: r.label, value: Number(r.value) || 0 })),
    payment_by_month: toMonthSeries(paymentByMonth),
    expected_by_month: toMonthSeries(expectedByMonth),
    calls_messages_by_month: callsMessagesByMonth,
    follow_up_history: followUpHistory || [],
  });
}
