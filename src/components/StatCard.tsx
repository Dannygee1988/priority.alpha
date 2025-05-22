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
    <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-800 text-white rounded-2xl shadow-lg transform transition-all hover:scale-[1.02] hover:shadow-xl">
      <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-8">
        <div className="absolute inset-0 bg-white opacity-10 rounded-full" />
      </div>
      
      <div className="relative p-6">
        <div className="flex justify-between items-start mb-4">
          <p className="text-white/80 font-medium">{title}</p>
          {icon && <div className="text-white/90">{icon}</div>}
        </div>

        <div className="space-y-2">
          <h3 className="text-3xl font-bold tracking-tight">
            {value || '-'}
          </h3>

          {change !== undefined && (
            <div className="flex items-center text-sm">
              <span
                className={`flex items-center font-medium ${
                  isPositive ? 'text-green-300' : isNegative ? 'text-red-300' : 'text-white/70'
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
              <span className="ml-1.5 text-white/60">vs last period</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;