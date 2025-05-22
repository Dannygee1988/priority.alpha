import React from 'react';
import {
  Share2,
  Megaphone,
  Users,
  Globe,
  LayoutDashboard,
  PoundSterling,
  Users2,
  LineChart,
  UserCog,
  Calendar,
  Inbox,
  Settings,
  Wrench,
  Brain,
  UserPlus,
} from 'lucide-react';
import { Stat, Tool } from '../types';
import DashboardStatistics from '../components/DashboardStatistics';
import ToolTile from '../components/ToolTile';

const stats: Stat[] = [
  {
    id: '1',
    title: 'Revenue',
    value: '£0',
    change: 0,
    icon: 'pound',
  },
  {
    id: '2',
    title: 'Users',
    value: '0',
    change: 0,
    icon: 'users',
  },
  {
    id: '3',
    title: 'Conversion Rate',
    value: '0%',
    change: 0,
    icon: 'activity',
  },
  {
    id: '4',
    title: 'Growth',
    value: '0%',
    change: 0,
    icon: 'trending-up',
  },
];

const tools: Tool[] = [
  {
    id: '1',
    name: 'Social Media',
    description: 'Manage and analyse social media presence',
    icon: 'share',
    path: '/social-media',
  },
  {
    id: '2',
    name: 'Marketing',
    description: 'Plan and execute marketing campaigns',
    icon: 'megaphone',
    path: '/marketing',
  },
  {
    id: '3',
    name: 'Investors',
    description: 'Investor relations and management',
    icon: 'users',
    path: '/investors',
  },
  {
    id: '4',
    name: 'Public Relations',
    description: 'Manage public relations and communications',
    icon: 'globe',
    path: '/pr',
  },
  {
    id: '5',
    name: 'Management',
    description: 'Business operations and management',
    icon: 'layout',
    path: '/management',
  },
  {
    id: '6',
    name: 'Finance',
    description: 'Financial tracking and reporting',
    icon: 'pound',
    path: '/finance',
  },
  {
    id: '7',
    name: 'Community',
    description: 'Community engagement and management',
    icon: 'users2',
    path: '/community',
  },
  {
    id: '8',
    name: 'Analytics',
    description: 'Business insights and analytics',
    icon: 'chart',
    path: '/analytics',
  },
  {
    id: '9',
    name: 'Human Resources',
    description: 'Employee management and HR tools',
    icon: 'user-cog',
    path: '/hr',
  },
  {
    id: '10',
    name: 'CRM',
    description: 'Customer relationship management',
    icon: 'user-plus',
    path: '/crm',
  },
  {
    id: '11',
    name: 'Tools',
    description: 'Business efficiency and file management tools',
    icon: 'wrench',
    path: '/tools',
  },
  {
    id: '12',
    name: 'Calendar',
    description: 'Schedule and manage appointments',
    icon: 'calendar',
    path: '/calendar',
  },
  {
    id: '13',
    name: 'Inbox',
    description: 'Messages and communications hub',
    icon: 'inbox',
    path: '/inbox',
  },
  {
    id: '14',
    name: 'Advisor',
    description: 'AI-powered business advice and insights',
    icon: 'brain',
    path: '/advisor',
  },
  {
    id: '15',
    name: 'Settings',
    description: 'Configure application settings',
    icon: 'settings',
    path: '/settings',
  },
];

const getToolIcon = (icon: string) => {
  switch (icon) {
    case 'share':
      return <Share2 size={24} />;
    case 'megaphone':
      return <Megaphone size={24} />;
    case 'users':
      return <Users size={24} />;
    case 'globe':
      return <Globe size={24} />;
    case 'layout':
      return <LayoutDashboard size={24} />;
    case 'pound':
      return <PoundSterling size={24} />;
    case 'users2':
      return <Users2 size={24} />;
    case 'chart':
      return <LineChart size={24} />;
    case 'user-cog':
      return <UserCog size={24} />;
    case 'user-plus':
      return <UserPlus size={24} />;
    case 'wrench':
      return <Wrench size={24} />;
    case 'calendar':
      return <Calendar size={24} />;
    case 'inbox':
      return <Inbox size={24} />;
    case 'brain':
      return <Brain size={24} />;
    case 'settings':
      return <Settings size={24} />;
    default:
      return <Settings size={24} />;
  }
};

const Dashboard: React.FC = () => {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">Dashboard</h1>
        <p className="text-neutral-500">Welcome back to Pri0r1ty. Here's what's happening today.</p>
      </div>

      <div className="mb-8">
        <DashboardStatistics stats={stats} />
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-neutral-800 mb-1">Business Tools</h2>
        <p className="text-neutral-500 mb-4">Access your essential business management tools</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tools.map((tool) => (
            <ToolTile
              key={tool.id}
              title={tool.name}
              description={tool.description}
              icon={getToolIcon(tool.icon)}
              path={tool.path}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;