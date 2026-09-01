'use client';
import { ReportSitesSchema } from '../ReportSitesSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import SitesActions from '../logicControl/actionsRegistry';

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function ReportSitesList() {
//   return <SmartGrid moduleActions={SitesActions} schema={ReportSitesSchema} title="Sites" />;
// }PaidInvoicesSchema.label
export default function ReportSitesList({
  fixedQuery = {},
  dataOut = {},
  title = ReportSitesSchema.label,
  description = `${ReportSitesSchema.label} list`,
  customProfilePath = './profile',
  moduleActions = SitesActions,
  schema = ReportSitesSchema,
  hiddenActions=[],

}) {
  return (
    <SmartGrid
      moduleActions={moduleActions}
      schema={schema}
      title={title}
      description={description}
      customProfilePath={customProfilePath}
      fixedQuery={fixedQuery}
      dataOut={dataOut}
      hiddenActions={hiddenActions}
    />
  );
}