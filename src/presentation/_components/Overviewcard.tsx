import React from 'react';
import { Car, User } from 'lucide-react';

// 1. Define TypeScript interfaces for strict type checking
interface CardItemProps {
  title: string;
  value: string | number;
  // Allows both Lucide component components and custom render functions (like the £ symbol)
  icon: React.ComponentType<{ className?: string }> | (() => React.JSX.Element);
  gradientClass: string;
}

interface CardData {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }> | (() => React.JSX.Element);
  gradientClass: string;
}

// 2. Sub-component with explicit TS props
const CardItem: React.FC<CardItemProps> = ({ title, value, icon: Icon, gradientClass }) => {
  return (
    <div className={`flex flex-col justify-between p-6 rounded-xl text-white shadow-md relative overflow-hidden h-36 ${gradientClass}`}>
      {/* Top Section: Title & Icon */}
      <div className="flex justify-between items-start w-full">
        <span className="text-xs font-normal text-slate-200 tracking-wide opacity-90">
          {title}
        </span>
        <div className="bg-white text-[#002855] p-2.5 rounded-xl shadow-sm flex items-center justify-center w-10 h-10">
          <Icon className="w-5 h-5 stroke-[2.5]" />
        </div>
      </div>

      {/* Bottom Section: Main Value */}
      <div className="mt-auto">
        <span className="text-4xl font-extrabold tracking-tight">
          {value}
        </span>
      </div>
    </div>
  );
};

// 3. Main Dashboard Overview Component
export default function OverviewCard(): React.JSX.Element {
  // Strongly typed data array to prevent structural errors
  const cardData: CardData[] = [
    {
      title: 'Total Revenue',
      value: '£2554',
      // Custom inline text icon so the '£' perfectly matches your UI screenshot style
      icon: () => <span className="text-lg font-extrabold leading-none select-none">£</span>,
      gradientClass: 'bg-[#002855]', 
    },
    {
      title: 'Active Journey Users',
      value: 228,
      icon: Car, // Lucide Car icon
      gradientClass: 'bg-[#0052B4]', 
    },
    {
      title: 'Monthly Lottery Participation',
      value: 124,
      icon: User, // Lucide User icon
      gradientClass: 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB]', 
    },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {cardData.map((card, index) => (
          <CardItem
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            gradientClass={card.gradientClass}
          />
        ))}
      </div>
    </div>
  );
}