import DashboardHeader from "@/common/header/Header";
import SubscriptionManagement from "@/presentation/subscription-management/SubscriptionManagement";
import React from "react";

function page() {
  return (
    <div>
      <DashboardHeader title="Subscription Management" />
      <SubscriptionManagement />
    </div>
  );
}

export default page;
