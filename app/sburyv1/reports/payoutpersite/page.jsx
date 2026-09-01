import { Suspense } from 'react';

import PayoutPerSiteHolder from './PayoutPerSiteHolder';

export async function generateMetadata() {
  return {
    title: 'Payout per Site Report',
    description: 'Payouts broken down by site',
    icons: {
      icon: '/logo.png',
    },
  };
}

export default function PayoutPerSitePage() {
  return (
    <>
      <div className="main-wrapper">
        <div className="page-wrapper">
          <div className="content container-fluid p-2 m-0">
            <Suspense fallback={<div>Loading...</div>}>
              <PayoutPerSiteHolder />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
