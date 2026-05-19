import DashboardHeader from '@/components/header/Header'
import EarningOverview from '@/presentation/_components/EarningOverview'
import JourneyOverview from '@/presentation/_components/JourneyOverview'
import OverviewCard from '@/presentation/_components/Overviewcard'
import React from 'react'

function page() {
  return (
    <div>
      <DashboardHeader title="Dashboard Overview" />
      <OverviewCard />
      <div className="mt-6 grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <EarningOverview />
        <JourneyOverview />
      </div>
    </div>
  )
}

export default page
