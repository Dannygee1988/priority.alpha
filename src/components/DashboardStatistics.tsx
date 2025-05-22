import React from 'react';
import { Stat } from '../types';
import StatCard from './StatCard';
import { 
  Users, 
  Share2,
  Star,
  MessageSquare
} from 'lucide-react';

interface DashboardStatisticsProps {
  stats: Stat[];
}

const DashboardStatistics: React.FC<DashboardStatisticsProps> = ({ stats }) => {
  return (
    <div className="mb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard 
            key={stat.id}
            title={stat.title} 
            value={stat.value} 
            change={stat.change} 
            icon={
              stat.icon === 'users' ? <Users className="w-6 h-6" /> :
              stat.icon === 'share' ? <Share2 className="w-6 h-6" /> :
              stat.icon === 'star' ? <Star className="w-6 h-6" /> :
              <MessageSquare className="w-6 h-6" />
            } 
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardStatistics;