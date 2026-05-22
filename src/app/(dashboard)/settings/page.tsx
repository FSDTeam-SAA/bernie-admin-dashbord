import DashboardHeader from "@/common/header/Header";
import Settings from "@/presentation/settings/Settings";
import React from "react";

function page() {
  return (
    <div>
      <DashboardHeader title="Settings" />
      <Settings />
    </div>
  );
}

export default page;
