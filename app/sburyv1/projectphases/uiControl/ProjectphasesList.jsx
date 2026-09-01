'use client';
import { ProjectphasesSchema } from '../ProjectphasesSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import ProjectphasesActions from '../logicControl/actionsRegistry';

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function ProjectphasesList() {
//   return <SmartGrid moduleActions={ProjectphasesActions} schema={ProjectphasesSchema} title="Projectphases" />;
// }PaidInvoicesSchema.label
export default function ProjectphasesList({
  fixedQuery = {},
  dataOut = {},
  title = ProjectphasesSchema.label,
  description = `${ProjectphasesSchema.label} list`,
  customProfilePath = './profile',
  moduleActions = ProjectphasesActions,
  schema = ProjectphasesSchema,
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