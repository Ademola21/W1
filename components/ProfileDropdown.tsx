import React from 'react';
import type { Page } from '../App';

interface ProfileDropdownProps {
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  isAuthenticated: boolean;
}

const DropdownItem: React.FC<{ onClick: () => void; children: React.ReactNode; isDanger?: boolean }> = ({ onClick, children, isDanger }) => (
  <button
    onClick={onClick}
    className={`block w-full text-left px-4 py-3 text-sm transition-colors duration-200 ${
        isDanger 
        ? 'text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10' 
        : 'text-gray-700 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-background-tertiary'
    }`}
  >
    {children}
  </button>
);

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onNavigate, onLogout, isAuthenticated }) => {
  return (
    <div
      className="absolute top-full right-0 mt-4 w-48 bg-white/90 dark:bg-background-secondary/90 backdrop-blur-lg rounded-lg shadow-xl border border-gray-200 dark:border-background-tertiary overflow-hidden animate-fade-in"
      style={{ animationDuration: '200ms' }}
    >
      <div className="py-1">
        {isAuthenticated ? (
            <>
                <DropdownItem onClick={() => onNavigate('profile')}>Profile</DropdownItem>
                <DropdownItem onClick={() => onNavigate('downloader')}>Downloads</DropdownItem>
                <DropdownItem onClick={onLogout} isDanger>Log Out</DropdownItem>
            </>
        ) : (
            <>
                <DropdownItem onClick={() => onNavigate('login')}>Login</DropdownItem>
                <DropdownItem onClick={() => onNavigate('signup')}>Sign Up</DropdownItem>
            </>
        )}
      </div>
    </div>
  );
};
