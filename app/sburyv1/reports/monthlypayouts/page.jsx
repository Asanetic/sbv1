import { Suspense } from 'react';

import MonthlyPayoutsHolder from './MonthlyPayoutsHolder';

export async function generateMetadata() {
  return {
    title: 'Monthly Payouts Report',
    description: 'Monthly payouts (M-Pesa payout confirmations) by month',
    icons: {
      icon: '/logo.png',
    },
  };
}

export default function MonthlyPayoutsPage() {
  return (
    <>
      <div className="main-wrapper">
        <div className="page-wrapper">
          <div className="content container-fluid p-2 m-0">
            <Suspense fallback={<div>Loading...</div>}>
              <MonthlyPayoutsHolder />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
