import React from 'react';
import { Stat } from '../types';
import StatCard from './StatCard';
import { 
  PoundSterling, 
  Users, 
  Activity, 
  TrendingUp 
} from 'lucide-react';

interface DashboardStatisticsProps {
  stats: Stat[];
}

const DashboardStatistics: React.FC<DashboardStatisticsProps> = ({ stats }) => {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Revenue" 
          value="£0" 
          change={0} 
          icon={<PoundSterling />} 
        />
        <StatCard 
          title="Users" 
          value="0" 
          change={0} 
          icon={<Users />} 
        />
        <StatCard 
          title="Conversion Rate" 
          value="0%" 
          change={0} 
          icon={<Activity />} 
        />
        <StatCard 
          title="Growth" 
          value="0%" 
          change={0} 
          icon={<TrendingUp />} 
        />
      </div>
    </div>
  );
};

export default DashboardStatistics;