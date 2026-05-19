import React from 'react';

interface DashboardHeaderProps {
  title?: string;
}

export default function DashboardHeader({ title = "Dashboard Overview" }: DashboardHeaderProps): React.JSX.Element {
  return (
    <div className="w-full mb-14 bg-[#FFFFFF]">
      <h1 className="font-bold text-2xl leading-[150%] text-slate-900 tracking-tight dark:text-white">
        {title}
      </h1>
    </div>
  );
}