import DashboardHeader from "@/common/header/Header";
import InsuranceListing from "@/presentation/insurance-listing/InsuranceListing";
import React from "react";

function page() {
  return (
    <div>
      <DashboardHeader title="Insurance Listing" />
      <InsuranceListing />
    </div>
  );
}

export default page;
