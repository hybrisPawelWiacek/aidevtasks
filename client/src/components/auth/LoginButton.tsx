import React from 'react';
import { Button } from '@/components/ui/button';
import { SiGoogle } from 'react-icons/si';

interface LoginButtonProps {
  onMockLogin?: () => void;
  isProduction?: boolean;
}

export const LoginButton: React.FC<LoginButtonProps> = ({ 
  onMockLogin,
  isProduction = import.meta.env.PROD
}) => {
  const handleLogin = () => {
    if (isProduction) {
      // In production, redirect to Google OAuth login
      window.location.href = '/api/auth/google/login';
    } else {
      // In development, use mock login if available
      if (onMockLogin) {
        onMockLogin();
      }
    }
  };

  return (
    <Button 
      className="flex items-center gap-2 bg-white text-gray-800 hover:bg-gray-100 border border-gray-300"
      onClick={handleLogin}
    >
      <SiGoogle className="h-4 w-4 text-[#4285F4]" />
      <span>Sign in with Google</span>
    </Button>
  );
};