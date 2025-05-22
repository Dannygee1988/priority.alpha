import React, { useState } from 'react';
import { Bell, User, LogOut, Settings, ChevronDown, Sun, Moon } from 'lucide-react';
import Button from './Button';

interface HeaderProps {
  user: {
    name: string;
    email: string;
    avatar: string;
  } | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // You would implement actual dark mode switching here
  };

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
      <div className="h-16 px-4 flex items-center justify-end">
        <div className="flex items-center">
          <button 
            onClick={toggleDarkMode} 
            className="p-2 rounded-full text-neutral-600 hover:text-primary hover:bg-primary/5 transition-colors"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <button className="ml-2 p-2 rounded-full text-neutral-600 hover:text-primary hover:bg-primary/5 transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent-600"></span>
          </button>
          
          {user ? (
            <div className="ml-3 relative">
              <div>
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center max-w-xs rounded-full text-sm focus:outline-none"
                >
                  <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                    <span className="font-medium">{user.name.charAt(0)}</span>
                  </div>
                  <span className="ml-2 text-neutral-700">{user.name}</span>
                  <ChevronDown 
                    size={16} 
                    className={`ml-1 text-neutral-500 transition-transform ${
                      showUserMenu ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>
              {showUserMenu && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10 animate-fade-in">
                  <div className="px-4 py-2 border-b border-neutral-100">
                    <p className="text-sm font-medium text-neutral-800">{user.name}</p>
                    <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                  </div>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User size={16} className="mr-2" />
                    Profile
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings size={16} className="mr-2" />
                    Settings
                  </a>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="ml-3">
              <Button size="sm">Sign in</Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header