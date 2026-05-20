import DashboardHeader from "@/common/header/Header";
import SetPrizes from "@/presentation/set-prizes/SetPrizes";
import React from "react";

function page() {
  return (
    <div>
      <DashboardHeader title="Set Prizes" />
      <SetPrizes />
    </div>
  );
}

export default page;
