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
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Followers" 
          value="0" 
          change={0} 
          icon={<Users className="w-6 h-6" />} 
        />
        <StatCard 
          title="Most Popular Platform" 
          value="Twitter" 
          change={0} 
          icon={<Share2 className="w-6 h-6" />} 
        />
        <StatCard 
          title="Community Score" 
          value="0%" 
          change={0} 
          icon={<Star className="w-6 h-6" />} 
        />
        <StatCard 
          title="Hot Topic" 
          value="None" 
          change={0} 
          icon={<MessageSquare className="w-6 h-6" />} 
        />
      </div>
    </div>
  );
};