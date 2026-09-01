'use client';

import { useEffect, useState } from 'react';

import DashboardHeader from './DashboardHeader';
import SectionTiles from './SectionTiles';
import CostPerCategory from './CostPerCategory';
import AnalyticsCharts from './AnalyticsCharts';
import ProjectSummary from './ProjectSummary';

import { mosyGetData, toNum } from '../../../MosyUtils/hiveUtils';
import { getApiRoutes } from '../../AppRoutes/apiRoutesHandler';
import { fmtKES } from './dashboardFormat';

const apiRoutes = getApiRoutes();

const EMPTY_DATA = {
  sites: [],
  finance: {},
  people: {},
  work: {},
  performance: { cost_per_category: [], labour_cost_per_category: [] },
  charts: {},
  project_summary: [],
};

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

// Defaults the header's date range (and therefore the first fetch) to the
// current calendar month, matching the API's own "no dates given" default —
// so the dashboard opens showing this month's data instead of a blank state.
function defaultFilters() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return { siteId: '', dateFrom: toDateStr(monthStart), dateTo: toDateStr(now) };
}

// Mirrors the API's own "previous period" math (superadmin/route.js): the
// span immediately before dateFrom, the same length as [dateFrom, dateTo].
// Used only to label what the trend % is actually being compared against.
function prevPeriodLabel(dateFrom, dateTo) {
  if (!dateFrom || !dateTo) return 'the previous period';

  const start = new Date(`${dateFrom}T00:00:00Z`);
  const endExclusive = new Date(`${dateTo}T00:00:00Z`);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  const durationMs = endExclusive.getTime() - start.getTime();

  const prevEndInclusive = new Date(start.getTime() - 24 * 60 * 60 * 1000);
  const prevStart = new Date(start.getTime() - durationMs);

  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return prevStart.getTime() === prevEndInclusive.getTime()
    ? fmt(prevStart)
    : `${fmt(prevStart)} – ${fmt(prevEndInclusive)}`;
}

export default function DashboardHolder() {
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(defaultFilters);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const params = {};
      if (filters.siteId) params.site_id = filters.siteId;
      if (filters.dateFrom) params.date_from = filters.dateFrom;
      if (filters.dateTo) params.date_to = filters.dateTo;

      const response = await mosyGetData({
        endpoint: apiRoutes.dashboard.superadmin,
        params,
      });

      if (response?.status === 'success') {
        setData({
          sites: response?.sites || [],
          finance: response?.finance || {},
          people: response?.people || {},
          work: response?.work || {},
          performance: response?.performance || { cost_per_category: [], labour_cost_per_category: [] },
          charts: response?.charts || {},
          project_summary: response?.project_summary || [],
        });
        setError(null);
      } else {
        setError(response?.message || 'Failed to load dashboard data');
      }

      setLoading(false);
    }

    fetchData();
  }, [filters]);

  if (loading) {
    return (
      <div className="col-md-12 text-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
          <span className="visually-hidden d-none">Loading...</span>
        </div>
        <p className="text-muted mt-3 mb-0">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-md-12 py-5">
        <div className="alert alert-danger text-center mb-0">
          <i className="fa fa-exclamation-triangle mr-2"></i>
          {error}
        </div>
      </div>
    );
  }

  const { finance, people, work, performance, charts, project_summary: projectSummary, sites } = data;

  const financeTiles = [
    { key: 'money_in', label: 'Money In', value: fmtKES(finance.money_in), trendPct: finance.money_in_trend_pct },
    { key: 'money_out', label: 'Money Out', value: fmtKES(finance.money_out), trendPct: finance.money_out_trend_pct },
    { key: 'expenses', label: 'Expenses', value: fmtKES(finance.expenses), trendPct: finance.expenses_trend_pct },
    {
      key: 'pending',
      label: 'Pending Payments',
      value: fmtKES(finance.pending_amount),
      note: `${toNum(finance.pending_count)} items`,
    },
  ];

  const peopleTiles = [
    { key: 'contractors', label: 'Contractors', value: toNum(people.contractors), note: 'Active' },
    { key: 'staff', label: 'Staff', value: toNum(people.staff), note: 'Active' },
    { key: 'managers', label: 'Managers', value: toNum(people.managers), note: 'Active' },
  ];

  const daysRecorded = toNum(work.attendance_days_recorded);
  const attendanceNote =
    daysRecorded > 0
      ? `${toNum(work.attendance_present)} / ${toNum(work.attendance_total)} avg across ${daysRecorded} day${daysRecorded === 1 ? '' : 's'} in period`
      : 'No attendance recorded in this period';

  const workTiles = [
    { key: 'phases', label: 'Project Phases', value: toNum(work.phases_total), note: 'Phase types' },
    { key: 'labour_cost', label: 'Labour Cost', value: fmtKES(work.labour_cost), note: 'Rate × Days' },
    {
      key: 'attendance',
      label: 'Attendance',
      value: `${work.attendance_pct || 0}%`,
      note: attendanceNote,
    },
  ];

  return (
    <div className="dash-wrapper col-md-12 p-0 m-0">
      <DashboardHeader sites={sites} filters={filters} onApply={setFilters} />

      <SectionTiles
        title="Finance"
        tiles={financeTiles}
        note="Money In = M-Pesa transactions. Money Out = payment_receivers rows with a transaction_ref (payout actually sent)."
        compareLabel={prevPeriodLabel(filters.dateFrom, filters.dateTo)}
      />
      <SectionTiles title="People" tiles={peopleTiles} />
      <SectionTiles
        title="Work"
        tiles={workTiles}
        note="Attendance reflects the most recent day recorded within the selected date range and site, not necessarily today."
      />

      <CostPerCategory items={performance.cost_per_category} labourItems={performance.labour_cost_per_category} />

      <AnalyticsCharts
        depositsPerSite={charts.deposits_per_site}
        depositsPerMonth={charts.deposits_per_month}
        payoutPerSite={charts.payout_per_site}
        payoutPerMonth={charts.payout_per_month}
      />

      <ProjectSummary items={projectSummary} />

      <style jsx global>{`
        .dash-wrapper .row > div {
          padding-left: 8px;
          padding-right: 8px;
        }
        .dash-wrapper .row {
          margin-left: -8px;
          margin-right: -8px;
        }
      `}</style>
    </div>
  );
}
