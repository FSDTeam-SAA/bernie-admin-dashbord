import DashboardHeader from "@/common/header/Header";
import TokenManagement from "@/presentation/token-management/TokenManagement";
import React from "react";

function page() {
  return (
    <div>
      <DashboardHeader title="Token Management" />
      <TokenManagement />
    </div>
  );
}

export default page;
