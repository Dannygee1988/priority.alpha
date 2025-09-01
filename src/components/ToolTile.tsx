import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
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
  ChevronDown,
  Image,
  FileEdit,
  Sparkles,
  FileCheck,
} from 'lucide-react';

interface ToolTileProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  disabled?: boolean;
}

const socialMediaOptions = [
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

const toolsOptions = [
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

const communityOptions = [
  { name: 'Bulletin Board', icon: Newspaper, path: '/community/bulletin-board' },
];

const investorsOptions = [
  { name: 'Shareholders', icon: UserCircle, path: '/investors/shareholders' },
  { name: 'Insiders', icon: Shield, path: '/investors/insiders' },
];

const prOptions = [
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

const ToolTile: React.FC<ToolTileProps> = ({ title, description, icon, path, disabled = false }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [showNestedPopup, setShowNestedPopup] = useState<string | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    
    if (title === 'Social Media' || title === 'Tools' || title === 'Community' || title === 'Investors' || title === 'Public Relations') {
      e.preventDefault();
      setShowPopup(!showPopup);
    }
  };

  const handleNestedClick = (e: React.MouseEvent, itemName: string) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setShowNestedPopup(showNestedPopup === itemName ? null : itemName);
  };

  const getOptions = () => {
    if (disabled) return [];
    if (title === 'Social Media') return socialMediaOptions;
    if (title === 'Tools') return toolsOptions;
    if (title === 'Community') return communityOptions;
    if (title === 'Investors') return investorsOptions;
    if (title === 'Public Relations') return prOptions;
    return [];
  };

  return (
    <div className="relative h-full">
      <Link 
        to={path}
        onClick={handleClick}
        className={`bg-white rounded-xl shadow-sm border border-neutral-100 transition-all group block h-full relative overflow-hidden ${
          disabled ? 'cursor-not-allowed opacity-50' : ''
        }`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent opacity-0 transition-all duration-300 ${
          disabled ? '' : 'group-hover:opacity-100'
        }`} />
        
        <div className="relative flex flex-col items-center justify-center h-full p-6">
          <div className={`p-4 rounded-xl bg-primary/5 text-primary transition-all duration-300 ${
            disabled ? 'text-neutral-400 bg-neutral-100' : 'transform group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary-700'
          }`}>
            {icon}
          </div>
          
          <h3 className={`font-bold text-lg mt-4 transition-colors ${
            disabled ? 'text-neutral-400' : 'text-primary group-hover:text-primary-700'
          }`}>
            {title}
            {disabled && <span className="ml-2 text-xs bg-neutral-200 text-neutral-500 px-2 py-1 rounded-full">Upgrade</span>}
          </h3>
          
          <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-sm opacity-0 transition-all duration-300 rounded-xl ${
            disabled ? '' : 'group-hover:opacity-100'
          }`}>
            <p className="text-neutral-600 text-sm px-4 text-center">
              {disabled ? 'Upgrade to access this feature' : description}
            </p>
          </div>
        </div>
      </Link>

      {showPopup && (getOptions().length > 0) && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 animate-fade-in">
          {getOptions().map((option) => (
            <div key={option.name}>
              {option.submenu ? (
                <div>
                  <button
                    onClick={(e) => handleNestedClick(e, option.name)}
                    className="w-full flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-primary/5 hover:text-primary transition-colors"
                  >
                    <option.icon size={18} className="mr-3" />
                    <span className="flex-1">{option.name}</span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${showNestedPopup === option.name ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {showNestedPopup === option.name && (
                    <div className="pl-8 bg-neutral-50">
                      {option.submenu.map((subOption) => (
                        <Link
                          key={subOption.name}
                          to={subOption.path}
                          className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-primary/5 hover:text-primary transition-colors"
                          onClick={() => {
                            setShowPopup(false);
                            setShowNestedPopup(null);
                          }}
                        >
                          <subOption.icon size={18} className="mr-3" />
                          {subOption.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={option.path}
                  className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-primary/5 hover:text-primary transition-colors"
                  onClick={() => setShowPopup(false)}
                >
                  <option.icon size={18} className="mr-3" />
                  {option.name}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ToolTile;