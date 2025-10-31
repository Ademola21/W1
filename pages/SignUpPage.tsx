import React, { useState } from 'react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { FormInput } from '../components/auth/FormInput';
import { FormButton } from '../components/auth/FormButton';
import type { Page } from '../App';
import { api } from '../services/api';

interface SignUpPageProps {
    onNavigate: (page: Page) => void;
    onBack: () => void;
    onLogin: (credentials: { name: string; email: string }) => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onNavigate, onBack, onLogin }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const userProfile = await api.signup(name, email, password);
      localStorage.setItem('userId', userProfile.id.toString());
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
      onLogin({ name: userProfile.name, email: userProfile.email });
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
    
  return (
    <AuthLayout onBack={onBack} onNavigate={onNavigate}>
        <div className="text-center">
            <h1 className="text-3xl font-bold text-text-primary">Create Account</h1>
            <p className="text-text-muted mt-2">Join CeniMax for an amazing movie experience</p>
        </div>
        {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-500 text-sm">{error}</p>
            </div>
        )}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <FormInput 
                id="fullName"
                name="fullName"
                type="text"
                label="Full Name"
                placeholder="John Doe"
                autoComplete="name"
                required
            />
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
                autoComplete="new-password"
                required
            />
            <FormButton type="submit" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
            </FormButton>
        </form>
        <div className="mt-6 text-center">
            <p className="text-text-muted">
                Already have an account?{' '}
                <button onClick={() => onNavigate('login')} className="font-semibold text-text-secondary hover:text-text-primary">
                    Sign In
                </button>
            </p>
        </div>
    </AuthLayout>
  );
};
