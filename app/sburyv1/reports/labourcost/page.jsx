import { Suspense } from 'react';

import LabourCostHolder from './LabourCostHolder';

export async function generateMetadata() {
  return {
    title: 'Labour Cost Report',
    description: 'Labour cost by site and month (work schedule)',
    icons: {
      icon: '/logo.png',
    },
  };
}

export default function LabourCostPage() {
  return (
    <>
      <div className="main-wrapper">
        <div className="page-wrapper">
          <div className="content container-fluid p-2 m-0">
            <Suspense fallback={<div>Loading...</div>}>
              <LabourCostHolder />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
