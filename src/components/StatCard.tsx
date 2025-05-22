import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon }) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 border border-neutral-100 transition-all hover:shadow-md">
      <div className="flex justify-between">
        <div>
          <p className="text-neutral-500 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-neutral-800 mt-1">{value}</h3>
        </div>
        {icon && <div className="text-primary">{icon}</div>}
      </div>

      {change !== undefined && (
        <div className="mt-2 flex items-center">
          <span
            className={`text-sm font-medium flex items-center ${
              isPositive ? 'text-success-500' : isNegative ? 'text-error-500' : 'text-neutral-500'
            }`}
          >
            {isPositive ? (
              <ArrowUp size={16} className="mr-1" />
            ) : isNegative ? (
              <ArrowDown size={16} className="mr-1" />
            ) : null}
            {isPositive ? '+' : ''}
            {change}%
          </span>
          <span className="ml-1 text-xs text-neutral-400">vs last period</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;