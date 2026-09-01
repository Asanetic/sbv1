import { Suspense } from 'react';

import DashboardHolder from './DashboardHolder';

export async function generateMetadata() {
  const mosyTitle = "Super Admin dashboard"//searchParams?.mosyTitle || "Projects";

  return {
    title: mosyTitle ? decodeURIComponent(mosyTitle) : `Super Admin dashboard`,
    description: 'Super Admin overview dashboard',
    
    icons: {
      icon: "/logo.png"
    },    
  };
}
      
export default function MainDashboard() {
  return (
        <>
         <div className="main-wrapper">
           <div className="page-wrapper">
              <div className="content container-fluid p-2 m-0 ">
                  <Suspense fallback={<div>Loading...</div>}>              
                    <DashboardHolder />
                  </Suspense>                 
              </div>
            </div>
          </div>
        </>
      );
}