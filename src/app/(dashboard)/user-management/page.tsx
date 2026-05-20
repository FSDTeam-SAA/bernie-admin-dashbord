import DashboardHeader from "@/common/header/Header";
import UserManagement from "@/presentation/user-management/UserManagement";
import React from "react";

function page() {
  return (
    <div>
      <DashboardHeader title="User Management" />
      <UserManagement />
    </div>
  );
}
export default page;
