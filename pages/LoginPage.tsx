import React, { useState } from 'react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { FormInput } from '../components/auth/FormInput';
import { FormButton } from '../components/auth/FormButton';
import type { Page } from '../App';
import { api } from '../services/api';

interface LoginPageProps {
    onNavigate: (page: Page) => void;
    onBack: () => void;
    onLogin: (credentials: { name: string; email: string }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, onBack, onLogin }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const userProfile = await api.login(email, password);
      localStorage.setItem('userId', userProfile.id.toString());
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
      onLogin({ name: userProfile.name, email: userProfile.email });
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };
    
  return (
    <AuthLayout onBack={onBack} onNavigate={onNavigate}>
        <div className="text-center">
            <h1 className="text-3xl font-bold text-text-primary">Welcome Back</h1>
            <p className="text-text-muted mt-2">Sign in to continue to CeniMax</p>
        </div>
        {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-500 text-sm">{error}</p>
            </div>
        )}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <FormInput 
                id="email"
                name="email"
                type="email"
                label="Email Address"
                placeholder="you@example.com"
                autoComplete="email"
                required
            />
            <FormInput 
                id="password"
                name="password"
                type="password"
                label="Password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
            />
            <div className="text-right">
                <a href="#" className="text-sm font-medium text-text-tertiary hover:text-text-primary">
                    Forgot password?
                </a>
            </div>
            <FormButton type="submit" disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Sign In'}
            </FormButton>
        </form>
        <div className="mt-6 text-center">
            <p className="text-text-muted">
                Don't have an account?{' '}
                <button onClick={() => onNavigate('signup')} className="font-semibold text-text-secondary hover:text-text-primary">
                    Sign Up
                </button>
            </p>
        </div>
    </AuthLayout>
  );
};
