'use client';
import { ExpensesSchema } from '../ExpensesSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import ExpensesActions from '../logicControl/actionsRegistry';

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function ExpensesList() {
//   return <SmartGrid moduleActions={ExpensesActions} schema={ExpensesSchema} title="Expenses" />;
// }PaidInvoicesSchema.label
export default function ExpensesList({
  fixedQuery = {},
  dataOut = {},
  title = ExpensesSchema.label,
  description = `${ExpensesSchema.label} list`,
  customProfilePath = './profile',
  moduleActions = ExpensesActions,
  schema = ExpensesSchema,
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