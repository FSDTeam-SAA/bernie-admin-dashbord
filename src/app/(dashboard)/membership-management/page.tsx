import DashboardHeader from "@/common/header/Header";
import MembershipManagement from "@/presentation/membership-management/MembershipManagement";
import React from "react";

function page() {
  return (
    <div>
      <DashboardHeader title="Member Management" />
      <MembershipManagement />
    </div>
  );
}

export default page;
