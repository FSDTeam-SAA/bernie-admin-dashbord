import React from "react";
import Manageworkers from "./_components/Manageworkers";
import DashboardHeader from '@/common/header/Header'

function page() {
  return (
    <div>
      <DashboardHeader title="Workers Management" />
      <Manageworkers />
    </div>
  );
}
    
export default page;
