'use client';
import { WorkscheduleSchema } from '../WorkscheduleSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import WorkscheduleActions from '../logicControl/actionsRegistry';

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function WorkscheduleList() {
//   return <SmartGrid moduleActions={WorkscheduleActions} schema={WorkscheduleSchema} title="Workschedule" />;
// }PaidInvoicesSchema.label
export default function WorkscheduleList({
  fixedQuery = {},
  dataOut = {},
  title = WorkscheduleSchema.label,
  description = `${WorkscheduleSchema.label} list`,
  customProfilePath = './profile',
  moduleActions = WorkscheduleActions,
  schema = WorkscheduleSchema,
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