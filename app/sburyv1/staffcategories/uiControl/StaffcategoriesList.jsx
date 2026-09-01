'use client';
import { StaffcategoriesSchema } from '../StaffcategoriesSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import StaffcategoriesActions from '../logicControl/actionsRegistry';

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function StaffcategoriesList() {
//   return <SmartGrid moduleActions={StaffcategoriesActions} schema={StaffcategoriesSchema} title="Staffcategories" />;
// }PaidInvoicesSchema.label
export default function StaffcategoriesList({
  fixedQuery = {},
  dataOut = {},
  title = StaffcategoriesSchema.label,
  description = `${StaffcategoriesSchema.label} list`,
  customProfilePath = './profile',
  moduleActions = StaffcategoriesActions,
  schema = StaffcategoriesSchema,
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