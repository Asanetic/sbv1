'use client';
import { PaybilldisbursmentsSchema } from '../PaybilldisbursmentsSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import PaybilldisbursmentsActions from '../logicControl/actionsRegistry';

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function PaybilldisbursmentsList() {
//   return <SmartGrid moduleActions={PaybilldisbursmentsActions} schema={PaybilldisbursmentsSchema} title="Paybilldisbursments" />;
// }PaidInvoicesSchema.label
export default function PaybilldisbursmentsList({
  fixedQuery = {},
  dataOut = {},
  title = PaybilldisbursmentsSchema.label,
  description = `${PaybilldisbursmentsSchema.label} list`,
  customProfilePath = './profile',
  moduleActions = PaybilldisbursmentsActions,
  schema = PaybilldisbursmentsSchema,
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