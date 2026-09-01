'use client';
import { ProjectsSitesSchema } from '../ProjectsSitesSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import SitesActions from '../logicControl/actionsRegistry';

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function ProjectsSitesList() {
//   return <SmartGrid moduleActions={SitesActions} schema={ProjectsSitesSchema} title="Sites" />;
// }PaidInvoicesSchema.label
export default function ProjectsSitesList({
  fixedQuery = {},
  dataOut = {},
  title = ProjectsSitesSchema.label,
  description = `${ProjectsSitesSchema.label} list`,
  customProfilePath = './profile',
  moduleActions = SitesActions,
  schema = ProjectsSitesSchema,
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