// sidebarConfigPOS.js
//
// Nav for the SUPER ADMIN role, matching the sburyv1 site/finance schema
// (attendance_list, staff, expenses, disbursment_schedule, site_list, etc.
// — see sburyv1-tables-dump.txt). Routes point at `${routes.cms}/<module>/list`
// following this app's existing module convention (folder name = table name
// with underscores stripped, e.g. site_list -> sitelist). Leaves under
// "Smart reports" and the report-style leaves in "Project report"/"Work"
// (Sitereport, Schedule report) have no backing page yet and are left as
// forward-looking placeholder routes, same as the AI Intelligence group and
// System Health.

export const sidebarConfig = [

  {
    type: "link",
    label: "Executive Dashboard",
    icon: "fa fa-dashboard",
    href: (routes) => `${routes.cms}/dashboard/main`,
    roles: []
  },

  {
    type: "submenu",
    label: "Project report",
    icon: "fa fa-building",
    roles: [],
    items: [
      { label: "Sites", href: (routes) => `${routes.cms}/sites/list`, roles: [] },
      { label: "Phases", href: (routes) => `${routes.cms}/projectphases/list`, roles: [] },
      { label: "Sitereport", href: (routes) => `${routes.cms}/sites/report`, roles: [] },
    ],
  },

  {
    type: "submenu",
    label: "People",
    icon: "fa fa-users",
    roles: [],
    items: [
      { label: "Labour categories", href: (routes) => `${routes.cms}/staffcategories/list`, roles: [] },
      { label: "Staff", href: (routes) => `${routes.cms}/staff/list`, roles: [] },
      { label: "Contractors", href: (routes) => `${routes.cms}/contractors/list`, roles: [] },
      { label: "Managers", href: (routes) => `${routes.cms}/systemusers/list`, roles: [] },
    ],
  },

  {
    type: "submenu",
    label: "Work",
    icon: "fa fa-tasks",
    roles: [],
    items: [
      { label: "Labour schedule", href: (routes) => `${routes.cms}/workschedule/list`, roles: [] },
      { label: "Schedule report", href: (routes) => `${routes.cms}/reports/schedulereport`, roles: [] },
      { label: "Employee schedule", href: (routes) => `${routes.cms}/attendance/list`, roles: [] },
    ],
  },

  {
    type: "submenu",
    label: "Finance",
    icon: "fa fa-money",
    roles: [],
    items: [
      { label: "Expenses", href: (routes) => `${routes.cms}/expenses/list`, roles: [] },
      { label: "Deposits", href: (routes) => `${routes.cms}/cashdeposits/list`, roles: [] },
      { label: "Payouts", href: (routes) => `${routes.cms}/paymentconfirmations/list`, roles: [] },
    ],
  },

  {
    type: "submenu",
    label: "Smart reports",
    icon: "fa fa-bar-chart",
    roles: [],
    items: [
      { label: "Monthly Deposits", href: (routes) => `${routes.cms}/reports/monthlydeposits`, roles: [] },
      { label: "Monthly Payouts", href: (routes) => `${routes.cms}/reports/monthlypayouts`, roles: [] },
      { label: "Monthly Expenses", href: (routes) => `${routes.cms}/reports/monthlyexpenses`, roles: [] },
      { label: "Payout per site", href: (routes) => `${routes.cms}/reports/payoutpersite`, roles: [] },
      { label: "Expenses per site", href: (routes) => `${routes.cms}/reports/expensespersite`, roles: [] },
      { label: "Labour Cost", href: (routes) => `${routes.cms}/reports/labourcost`, roles: [] },
    ],
  },
  {
    type: "submenu",
    label: "AI Intelligence",
    icon: "fa fa-magic",
    roles: [],
    items: [
      { label: "Insights", href: (routes) => `${routes.cms}/ai/insights`, roles: [] },
      { label: "Anomalies", href: (routes) => `${routes.cms}/ai/anomalies`, roles: [] },
      { label: "Forecasts", href: (routes) => `${routes.cms}/ai/forecasts`, roles: [] },
      { label: "Ask AI", href: (routes) => `${routes.cms}/ai/ask`, roles: [] },
    ],
  },

  {
    type: "submenu",
    label: "System",
    icon: "fa fa-cogs",
    roles: [],
    items: [
      { label: "System Settings", href: (routes) => `${routes.cms}/docsettings/list`, roles: [] },
      { label: "URLs", href: (routes) => `${routes.cms}/accounturls/list`, roles: [] },
      { label: "System Health", href: (routes) => `${routes.cms}/system/health`, roles: [] },
    ],
  },

];
