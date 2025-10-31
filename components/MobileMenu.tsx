import React, { useEffect } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import type { Page } from '../App';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: Page) => void;
  isAuthenticated: boolean;
  onLogout: () => void;
}

const MobileNavLink: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
    <button
      onClick={onClick}
      className="text-3xl font-bold text-gray-800 dark:text-text-primary py-4 w-full text-center"
    >
      {children}
    </button>
  );

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, onNavigate, isAuthenticated, onLogout }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleLogoutClick = () => {
    onLogout();
    onClose();
  }

  return (
    <div 
      className="fixed inset-0 z-[100] bg-white/80 dark:bg-black/80 backdrop-blur-lg animate-fade-in flex flex-col items-center justify-center p-4"
      onClick={onClose}
    >
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 dark:text-text-muted hover:text-black dark:hover:text-white transition-colors">
            <CloseIcon className="w-8 h-8" />
        </button>
        <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <nav className="flex flex-col items-center space-y-6">
                <MobileNavLink onClick={() => onNavigate('home')}>Home</MobileNavLink>
                <MobileNavLink onClick={() => onNavigate('home')}>Movies</MobileNavLink>
                <MobileNavLink onClick={() => onNavigate('home')}>Series</MobileNavLink>
                <MobileNavLink onClick={() => onNavigate('home')}>Kids</MobileNavLink>
            </nav>

            <div className="mt-12 pt-8 border-t border-gray-300 dark:border-gray-700 w-full flex flex-col items-center space-y-4">
                {isAuthenticated ? (
                    <>
                        <MobileNavLink onClick={() => onNavigate('profile')}>Profile</MobileNavLink>
                        <button onClick={handleLogoutClick} className="text-xl font-bold text-red-600 dark:text-red-500 py-4 w-full text-center">
                            Log Out
                        </button>
                    </>
                ) : (
                    <>
                        <MobileNavLink onClick={() => onNavigate('login')}>Login</MobileNavLink>
                        <MobileNavLink onClick={() => onNavigate('signup')}>Sign Up</MobileNavLink>
                    </>
                )}
            </div>
        </div>
    </div>
  );
};
