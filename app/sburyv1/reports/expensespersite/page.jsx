import { Suspense } from 'react';

import ExpensesPerSiteHolder from './ExpensesPerSiteHolder';

export async function generateMetadata() {
  return {
    title: 'Expenses per Site Report',
    description: 'Expenses broken down by site',
    icons: {
      icon: '/logo.png',
    },
  };
}

export default function ExpensesPerSitePage() {
  return (
    <>
      <div className="main-wrapper">
        <div className="page-wrapper">
          <div className="content container-fluid p-2 m-0">
            <Suspense fallback={<div>Loading...</div>}>
              <ExpensesPerSiteHolder />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
