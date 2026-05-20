import DashboardHeader from "@/common/header/Header";
import JourneyManagement from "@/presentation/journey-management/JourneyManagement";
import React from "react";

function page() {
  return (
    <div>
      <DashboardHeader title="Journey Management" />
      <JourneyManagement />
    </div>
  );
}

export default page;
