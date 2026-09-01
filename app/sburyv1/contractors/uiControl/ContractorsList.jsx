'use client';
import { ContractorsSchema } from '../ContractorsSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import ContractorsActions from '../logicControl/actionsRegistry';

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function ContractorsList() {
//   return <SmartGrid moduleActions={ContractorsActions} schema={ContractorsSchema} title="Contractors" />;
// }PaidInvoicesSchema.label
export default function ContractorsList({
  fixedQuery = {},
  dataOut = {},
  title = ContractorsSchema.label,
  description = `${ContractorsSchema.label} list`,
  customProfilePath = './profile',
  moduleActions = ContractorsActions,
  schema = ContractorsSchema,
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