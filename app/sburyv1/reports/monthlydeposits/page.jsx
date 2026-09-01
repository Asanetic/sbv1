import { Suspense } from 'react';

import MonthlyDepositsHolder from './MonthlyDepositsHolder';

export async function generateMetadata() {
  return {
    title: 'Monthly Deposits Report',
    description: 'Monthly deposits (M-Pesa transactions) by site and month',
    icons: {
      icon: '/logo.png',
    },
  };
}

export default function MonthlyDepositsPage() {
  return (
    <>
      <div className="main-wrapper">
        <div className="page-wrapper">
          <div className="content container-fluid p-2 m-0">
            <Suspense fallback={<div>Loading...</div>}>
              <MonthlyDepositsHolder />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
