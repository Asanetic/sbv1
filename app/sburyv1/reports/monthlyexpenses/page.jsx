import { Suspense } from 'react';

import MonthlyExpensesHolder from './MonthlyExpensesHolder';

export async function generateMetadata() {
  return {
    title: 'Monthly Expenses Report',
    description: 'Monthly expenses by site and category',
    icons: {
      icon: '/logo.png',
    },
  };
}

export default function MonthlyExpensesPage() {
  return (
    <>
      <div className="main-wrapper">
        <div className="page-wrapper">
          <div className="content container-fluid p-2 m-0">
            <Suspense fallback={<div>Loading...</div>}>
              <MonthlyExpensesHolder />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
