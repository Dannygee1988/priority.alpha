import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  PenSquare,
  MessageSquare,
  Palette,
  Hash,
  TrendingUp,
  CalendarDays,
  Video,
  Images,
  Type,
  BookOpen,
  Wrench,
  FileType2,
  ScanLine,
  FileSearch,
  FileCog,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileAudio,
  FileVideo,
  Printer,
  Newspaper,
  Brain,
  UserCircle,
  Shield,
  UserPlus,
} from 'lucide-react';

const socialMediaSubmenu = [
  { name: 'Create New Post', icon: PenSquare, path: '/social-media/create' },
  { name: 'Generate Captions', icon: MessageSquare, path: '/social-media/captions' },
  { name: 'Create Graphics', icon: Palette, path: '/social-media/graphics' },
  { name: 'Hashtag Suggestions', icon: Hash, path: '/social-media/hashtags' },
  { name: 'Trending Tags', icon: TrendingUp, path: '/social-media/trending' },
  { name: 'Content Calendar', icon: CalendarDays, path: '/social-media/calendar' },
  { name: 'Video Scripts', icon: Video, path: '/social-media/scripts' },
  { name: 'Carousel Posts', icon: Images, path: '/social-media/carousel' },
  { name: 'Headlines & Hooks', icon: Type, path: '/social-media/headlines' },
  { name: 'Story Content', icon: BookOpen, path: '/social-media/stories' },
];

const toolsSubmenu = [
  { name: 'File Converter', icon: FileType2, path: '/tools/converter' },
  { name: 'Business Card Scanner', icon: ScanLine, path: '/tools/card-scanner' },
  { name: 'Document OCR', icon: FileSearch, path: '/tools/ocr' },
  { name: 'File Compressor', icon: FileCog, path: '/tools/compressor' },
  { name: 'PDF Tools', icon: FileText, path: '/tools/pdf' },
  { name: 'Excel Tools', icon: FileSpreadsheet, path: '/tools/excel' },
  { name: 'Image Editor', icon: FileImage, path: '/tools/image' },
  { name: 'Audio Editor', icon: FileAudio, path: '/tools/audio' },
  { name: 'Video Editor', icon: FileVideo, path: '/tools/video' },
  { name: 'Print Templates', icon: Printer, path: '/tools/templates' },
];

const communitySubmenu = [
  { name: 'Bulletin Board', icon: Newspaper, path: '/community/bulletin-board' },
];

const investorsSubmenu = [
  { name: 'Shareholders', icon: UserCircle, path: '/investors/shareholders' },
  { name: 'Insiders', icon: Shield, path: '/investors/insiders' },
];

const navigation = [
  {
    name: 'Social Media',
    icon: Share2,
    path: '/social-media',
    submenu: socialMediaSubmenu,
  },
  { name: 'Marketing', icon: Megaphone, path: '/marketing' },
  {
    name: 'Investors',
    icon: Users,
    path: '/investors',
    submenu: investorsSubmenu,
  },
  { name: 'Public Relations', icon: Globe, path: '/pr' },
  { name: 'Management', icon: LayoutDashboard, path: '/management' },
  { name: 'Finance', icon: PoundSterling, path: '/finance' },
  {
    name: 'Community',
    icon: Users2,
    path: '/community',
    submenu: communitySubmenu,
  },
  { name: 'Analytics', icon: LineChart, path: '/analytics' },
  { name: 'Human Resources', icon: UserCog, path: '/hr' },
  { name: 'CRM', icon: UserPlus, path: '/crm' },
  {
    name: 'Tools',
    icon: Wrench,
    path: '/tools',
    submenu: toolsSubmenu,
  },
  { name: 'Calendar', icon: Calendar, path: '/calendar' },
  { name: 'Inbox', icon: Inbox, path: '/inbox' },
  { name: 'Advisor', icon: Brain, path: '/advisor' },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setExpandedSubmenu(null);
    }
  };

  const toggleSubmenu = (name: string) => {
    setExpandedSubmenu(expandedSubmenu === name ? null : name);
  };

  const NavLink = ({ 
    item, 
    isSubmenuItem = false 
  }: { 
    item: { 
      name: string; 
      icon: any; 
      path: string; 
      submenu?: typeof socialMediaSubmenu;
    };
    isSubmenuItem?: boolean;
  }) => {
    const isActive = location.pathname === item.path;
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isSubmenuExpanded = expandedSubmenu === item.name;

    return (
      <div>
        <div
          className={`
            flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer
            ${isActive ? 'text-primary bg-primary/5' : 'text-neutral-600 hover:text-primary hover:bg-primary/5'}
            ${!isExpanded && 'justify-center'}
            ${isSubmenuItem && 'pl-6'}
          `}
          onClick={() => hasSubmenu ? toggleSubmenu(item.name) : null}
          title={!isExpanded ? item.name : undefined}
        >
          <item.icon size={20} className={isExpanded ? 'mr-3' : ''} />
          {isExpanded && (
            <>
              <span className="flex-1">{item.name}</span>
              {hasSubmenu && (
                <ChevronDown
                  size={16}
                  className={`transition-transform ${isSubmenuExpanded ? 'rotate-180' : ''}`}
                />
              )}
            </>
          )}
        </div>

        {isExpanded && hasSubmenu && isSubmenuExpanded && (
          <div className="mt-1 ml-3 space-y-1">
            {item.submenu?.map((subItem) => (
              <Link
                key={subItem.name}
                to={subItem.path}
                className={`
                  flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${location.pathname === subItem.path
                    ? 'text-primary bg-primary/5'
                    : 'text-neutral-600 hover:text-primary hover:bg-primary/5'
                  }
                `}
              >
                <subItem.icon size={18} className="mr-3" />
                {subItem.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className={`bg-white border-r border-neutral-200 h-screen fixed left-0 top-0 transition-all duration-300 flex flex-col ${
        isExpanded ? 'w-64' : 'w-20'
      }`}
    >
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <Link to="/dashboard" className="flex items-center mb-8">
            <div className="bg-primary rounded-md p-1.5 mr-2">
              <span className="text-white text-lg font-bold">P</span>
            </div>
            {isExpanded && (
              <span className="text-primary font-bold text-xl">Pri0r1ty</span>
            )}
          </Link>

          <nav className="space-y-1">
            {navigation.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-neutral-200">
        <NavLink item={{ name: 'Settings', icon: Settings, path: '/settings' }} />
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 mt-2 rounded-md text-neutral-600 hover:text-primary hover:bg-primary/5 transition-colors"
        >
          {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;