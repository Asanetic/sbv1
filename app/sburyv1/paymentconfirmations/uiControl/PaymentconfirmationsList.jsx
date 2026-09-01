'use client';
import { PaymentconfirmationsSchema } from '../PaymentconfirmationsSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import PaymentconfirmationsActions from '../logicControl/actionsRegistry';

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function PaymentconfirmationsList() {
//   return <SmartGrid moduleActions={PaymentconfirmationsActions} schema={PaymentconfirmationsSchema} title="Paymentconfirmations" />;
// }PaidInvoicesSchema.label
export default function PaymentconfirmationsList({
  fixedQuery = {},
  dataOut = {},
  title = PaymentconfirmationsSchema.label,
  description = `${PaymentconfirmationsSchema.label} list`,
  customProfilePath = './profile',
  moduleActions = PaymentconfirmationsActions,
  schema = PaymentconfirmationsSchema,
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