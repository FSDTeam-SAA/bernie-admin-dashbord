import DashboardHeader from "@/common/header/Header";
import CategoryManagement from "@/presentation/category-management/CategoryManagement";
import React from "react";

function page() {
  return (
    <div>
      <DashboardHeader title="Catagory Management" />
      <CategoryManagement />
    </div>
  );
}

export default page;
