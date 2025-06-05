import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  UserCircle,
  Shield,
  AlertCircle,
  PenLine,
  Database,
  Sparkles,
  UserPlus,
  Image,
  FileEdit,
  FileCheck,
  Brain,
  Bot,
  MessagesSquare,
  ListFilter,
} from 'lucide-react';

const socialMediaSubmenu = [
  { name: 'Posts', icon: ListFilter, path: '/social-media/posts' },
  { name: 'Create New Post', icon: PenSquare, path: '/social-media/create' },
  { name: 'Generate Captions', icon: MessageSquare, path: '/social-media/captions' },
  { name: 'Create Graphics', icon: Palette, path: '/social-media/graphics' },
  { name: 'Gallery', icon: Image, path: '/social-media/gallery' },
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

const prSubmenu = [
  { 
    name: 'RNS', 
    icon: AlertCircle, 
    path: '/pr/rns',
    submenu: [
      { name: 'Write new RNS', icon: PenLine, path: '/pr/rns/write' },
      { name: 'Improve RNS', icon: Sparkles, path: '/pr/rns/improve' },
      { name: 'Drafts', icon: FileEdit, path: '/pr/rns/drafts' },
      { name: 'Published RNS', icon: FileCheck, path: '/pr/rns/published' }
    ]
  },
];

const advisorSubmenu = [
  { name: 'GPT', icon: Bot, path: '/gpt' },
  { name: 'Chats', icon: MessagesSquare, path: '/chats' },
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
  {
    name: 'Public Relations',
    icon: Globe,
    path: '/pr',
    submenu: prSubmenu,
  },
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
  { name: 'Data', icon: Database, path: '/data' },
  {
    name: 'Tools',
    icon: Wrench,
    path: '/tools',
    submenu: toolsSubmenu,
  },
  {
    name: 'Advisor',
    icon: Brain,
    path: '/advisor',
    submenu: advisorSubmenu,
  },
  { name: 'Calendar', icon: Calendar, path: '/calendar' },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);
  const [expandedNestedSubmenu, setExpandedNestedSubmenu] = useState<string | null>(null);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setExpandedSubmenu(null);
      setExpandedNestedSubmenu(null);
    }
  };

  const toggleSubmenu = (name: string) => {
    setExpandedSubmenu(expandedSubmenu === name ? null : name);
    setExpandedNestedSubmenu(null);
  };

  const toggleNestedSubmenu = (name: string) => {
    setExpandedNestedSubmenu(expandedNestedSubmenu === name ? null : name);
  };

  const handleNavigation = (path: string, hasSubmenu: boolean) => {
    if (!hasSubmenu) {
      navigate(path);
    }
  };

  const NavLink = ({ 
    item, 
    isSubmenuItem = false,
    isNestedSubmenuItem = false
  }: { 
    item: { 
      name: string; 
      icon: any; 
      path: string; 
      submenu?: any[];
    };
    isSubmenuItem?: boolean;
    isNestedSubmenuItem?: boolean;
  }) => {
    const isActive = location.pathname === item.path;
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isSubmenuExpanded = expandedSubmenu === item.name;
    const isNestedSubmenuExpanded = expandedNestedSubmenu === item.name;

    return (
      <div>
        <div
          className={`
            flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer
            ${isActive ? 'text-primary bg-primary/5' : 'text-neutral-600 hover:text-primary hover:bg-primary/5'}
            ${!isExpanded && 'justify-center'}
            ${isSubmenuItem && 'pl-6'}
            ${isNestedSubmenuItem && 'pl-9'}
          `}
          onClick={() => {
            if (hasSubmenu) {
              isSubmenuItem ? toggleNestedSubmenu(item.name) : toggleSubmenu(item.name);
            } else {
              handleNavigation(item.path, hasSubmenu);
            }
          }}
          title={!isExpanded ? item.name : undefined}
        >
          <item.icon size={20} className={isExpanded ? 'mr-3' : ''} />
          {isExpanded && (
            <>
              <span className="flex-1">{item.name}</span>
              {hasSubmenu && (
                <ChevronDown
                  size={16}
                  className={`transition-transform ${(isSubmenuExpanded || isNestedSubmenuExpanded) ? 'rotate-180' : ''}`}
                />
              )}
            </>
          )}
        </div>

        {isExpanded && hasSubmenu && (isSubmenuExpanded || isNestedSubmenuExpanded) && (
          <div className={`mt-1 ml-3 space-y-1 ${isNestedSubmenuItem ? 'pl-3' : ''}`}>
            {item.submenu?.map((subItem) => (
              <NavLink
                key={subItem.name}
                item={subItem}
                isSubmenuItem={!isSubmenuItem}
                isNestedSubmenuItem={isSubmenuItem}
              />
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
          <Link to="/dashboard" className="flex items-center justify-center mb-8">
            {isExpanded && (
              <img 
                src="https://res.cloudinary.com/deyzbqzya/image/upload/v1747914532/Pri0r1ty_PRIMARY-Logo_Colour-Long-Pos-RGB_1_qhsx8u.png"
                alt="Logo"
                className="h-24 w-auto"
              />
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
        <NavLink item={{ name: 'Inbox', icon: Inbox, path: '/inbox' }} />
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