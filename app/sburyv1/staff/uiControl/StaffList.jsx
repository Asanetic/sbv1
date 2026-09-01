'use client';
import { StaffSchema } from '../StaffSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import StaffActions from '../logicControl/actionsRegistry';

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function StaffList() {
//   return <SmartGrid moduleActions={StaffActions} schema={StaffSchema} title="Staff" />;
// }PaidInvoicesSchema.label
export default function StaffList({
  fixedQuery = {},
  dataOut = {},
  title = StaffSchema.label,
  description = `${StaffSchema.label} list`,
  customProfilePath = './profile',
  moduleActions = StaffActions,
  schema = StaffSchema,
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