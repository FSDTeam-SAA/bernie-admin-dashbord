import DashboardHeader from "@/common/header/Header";
import TransactionManagement from "@/presentation/transaction-management/TransactionManagement";
import React from "react";

function page() {
  return (
    <div>
      <DashboardHeader title="Transaction Management" />
      <TransactionManagement />
    </div>
  );
}

export default page;
