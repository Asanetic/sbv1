'use client';
import { CashdepositsSchema } from '../CashdepositsSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import CashdepositsActions from '../logicControl/actionsRegistry';

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function CashdepositsList() {
//   return <SmartGrid moduleActions={CashdepositsActions} schema={CashdepositsSchema} title="Cashdeposits" />;
// }PaidInvoicesSchema.label
export default function CashdepositsList({
  fixedQuery = {},
  dataOut = {},
  title = CashdepositsSchema.label,
  description = `${CashdepositsSchema.label} list`,
  customProfilePath = './profile',
  moduleActions = CashdepositsActions,
  schema = CashdepositsSchema,
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