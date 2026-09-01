'use client';
import { AttendanceSchema } from '../AttendanceSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import AttendanceActions from '../logicControl/actionsRegistry';

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function AttendanceList() {
//   return <SmartGrid moduleActions={AttendanceActions} schema={AttendanceSchema} title="Attendance" />;
// }PaidInvoicesSchema.label
export default function AttendanceList({
  fixedQuery = {},
  dataOut = {},
  title = AttendanceSchema.label,
  description = `${AttendanceSchema.label} list`,
  customProfilePath = './profile',
  moduleActions = AttendanceActions,
  schema = AttendanceSchema,
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