import React, { useState } from 'react';
import { Bell, User, LogOut, Settings, ChevronDown, Sun, Moon, ArrowLeft } from 'lucide-react';
import Button from './Button';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // You would implement actual dark mode switching here
  };

  const handleBack = () => {
    navigate(-1);
  };

  const showBackButton = location.pathname !== '/dashboard';

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
      <div className="h-16 px-6 flex items-center justify-between">
        <div className="flex items-center">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="mr-4 p-2 rounded-full text-neutral-600 hover:text-primary hover:bg-primary/5 transition-colors"
              title="Go back"
            >
              <ArrowLeft size={20} />
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleDarkMode} 
            className="p-2 rounded-full text-neutral-600 hover:text-primary hover:bg-primary/5 transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <div className="relative">
            <button 
              className="p-2 rounded-full text-neutral-600 hover:text-primary hover:bg-primary/5 transition-colors"
              title="Notifications"
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent-600"></span>
            </button>
          </div>
          
          {user ? (
            <div className="relative">
              <button
                onClick={toggleUserMenu}
                className="flex items-center px-3 py-2 rounded-full hover:bg-primary/5 transition-colors"
              >
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                    <span className="font-medium">{user.name.charAt(0)}</span>
                  </div>
                )}
                <span className="ml-2 text-neutral-700 font-medium">{user.name}</span>
                <ChevronDown 
                  size={16} 
                  className={`ml-1 text-neutral-500 transition-transform ${
                    showUserMenu ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10 animate-fade-in">
                  <div className="px-4 py-3 border-b border-neutral-100">
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
                  <div className="border-t border-neutral-100 mt-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full text-left block px-4 py-2 text-sm text-error-600 hover:bg-neutral-50 flex items-center"
                    >
                      <LogOut size={16} className="mr-2" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button size="sm">Sign in</Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;