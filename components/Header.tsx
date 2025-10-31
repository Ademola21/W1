import React, { useState, useRef, useEffect } from 'react';
import { SearchIcon } from './icons/SearchIcon';
import { ThemeToggleIcon } from './icons/ThemeToggleIcon';
import { ProfileDropdown } from './ProfileDropdown';
import type { Page } from '../App';
import type { UserProfile } from '../types';
import { MenuIcon } from './icons/MenuIcon';
import { MobileMenu } from './MobileMenu';

interface HeaderProps {
  onSearchClick: () => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  isDetailsPage: boolean;
  onNavigate: (page: Page) => void;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  onLogout: () => void;
}

const NavLink: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="text-text-tertiary hover:text-text-primary transition-colors duration-300 font-medium text-sm md:text-base"
  >
    {children}
  </button>
);

const HeaderComponent: React.FC<HeaderProps> = ({ onSearchClick, theme, onThemeToggle, isDetailsPage, onNavigate, userProfile, isAuthenticated, onLogout }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  
  const headerClasses = isDetailsPage 
    ? "sticky top-0 left-0 right-0 z-50 bg-white/80 dark:bg-background-primary/80 backdrop-blur-lg shadow-md"
    : "absolute top-0 left-0 right-0 z-50";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMobileNav = (page: Page) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  }

  const handleDropdownNavigate = (page: Page) => {
    onNavigate(page);
    setIsProfileOpen(false);
  }

  return (
    <>
      <header className={headerClasses}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center space-x-8">
              <button onClick={() => onNavigate('home')} className={`text-2xl sm:text-3xl font-black tracking-wide ${isDetailsPage ? 'text-black dark:text-white' : 'text-white'}`}>
                CeniMax
              </button>
              <nav className="hidden md:flex items-center space-x-6">
                <NavLink onClick={() => onNavigate('home')}>Home</NavLink>
                <NavLink onClick={() => onNavigate('home')}>Movies</NavLink>
                <NavLink onClick={() => onNavigate('home')}>Series</NavLink>
                <NavLink onClick={() => onNavigate('home')}>Kids</NavLink>
              </nav>
            </div>
            <div className="flex items-center space-x-4 md:space-x-6">
                <button onClick={onSearchClick} className="text-text-tertiary hover:text-white transition-colors">
                  <SearchIcon className="w-6 h-6" />
                </button>
                <button onClick={onThemeToggle} className="text-text-tertiary hover:text-white transition-colors">
                  <ThemeToggleIcon theme={theme} className="w-6 h-6" />
                </button>
                
                {isAuthenticated && userProfile ? (
                    <div className="relative" ref={profileMenuRef}>
                        <button 
                            onClick={() => setIsProfileOpen(prev => !prev)} 
                            className="w-9 h-9 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-background-primary focus:ring-white"
                        >
                            <img src={userProfile.avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                        </button>
                        {isProfileOpen && <ProfileDropdown onNavigate={handleDropdownNavigate} onLogout={onLogout} isAuthenticated={isAuthenticated} />}
                    </div>
                ) : (
                    <div className="hidden md:flex items-center space-x-2">
                        <button onClick={() => onNavigate('login')} className="px-4 py-2 rounded-full text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors">
                            Login
                        </button>
                         <button onClick={() => onNavigate('signup')} className="px-4 py-2 rounded-full text-sm font-semibold bg-white text-black hover:bg-opacity-90 transition-colors">
                            Sign Up
                        </button>
                    </div>
                )}

                <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-text-tertiary hover:text-white transition-colors">
                  <MenuIcon className="w-6 h-6" />
                </button>
            </div>
          </div>
        </div>
      </header>
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        onNavigate={handleMobileNav} 
        isAuthenticated={isAuthenticated}
        onLogout={onLogout}
      />
    </>
  );
};

export const Header = React.memo(HeaderComponent);