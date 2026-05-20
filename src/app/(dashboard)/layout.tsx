// import AppProvider from "@/provider/AppProvider";
// import Header from "@/components/header/Header";
import { Sidebar } from "@/common/sidebar/Sidebar";
import React from "react";

function layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* <Header /> */}
      <div className="flex">
        <Sidebar />
        <div className="w-full p-6">
          {/* <AppProvider> */}
            {children}
            {/* </AppProvider> */}
        </div>
      </div>
    </>
  );
}

export default layout;
