import DashboardHeader from "@/common/header/Header";
import WorkersDetails from "../_components/WorkersDetails";

function page() {
  return (
    <div>
      <DashboardHeader title="Worker Access Details" />
      <WorkersDetails />
    </div>
  );
}

export default page;
