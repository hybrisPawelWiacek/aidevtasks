import React from 'react';
import { Button } from '@/components/ui/button';
import { SiGoogle } from 'react-icons/si';
import { useToast } from '@/hooks/use-toast';

interface LoginButtonProps {
  onMockLogin?: () => void;
  isProduction?: boolean;
}

export const LoginButton: React.FC<LoginButtonProps> = ({ 
  onMockLogin,
  isProduction = import.meta.env.PROD
}) => {
  const { toast } = useToast();
  
  const handleLogin = () => {
    try {
      console.log("LoginButton: handleLogin called, isProduction:", isProduction);
      
      if (isProduction) {
        // In production, redirect to Google OAuth login
        toast({
          title: "Redirecting to Google...",
          description: "Please wait while we redirect you to Google for authentication.",
        });
        
        // Add a small delay to allow toast to show
        setTimeout(() => {
          window.location.href = '/api/auth/google/login';
        }, 500);
      } else {
        // In development, use mock login if available
        if (onMockLogin) {
          onMockLogin();
        }
      }
    } catch (error) {
      console.error("Error during login process:", error);
      toast({
        variant: "destructive",
        title: "Login Error",
        description: "Failed to initiate login. Please try again.",
      });
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