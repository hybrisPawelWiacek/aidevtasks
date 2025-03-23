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
  
  // We'll no longer directly verify Google API - instead, we'll rely on our backend
  const verifyGoogleAPI = async () => {
    try {
      // For debugging, log the OAuth configuration
      console.log("Google OAuth configured URLs:", {
        clientId: "640277032312-n2amkdnbpupkfsvjk7ref40gep4o2qdn.apps.googleusercontent.com",
        redirectUri: "https://todo.agenticforce.io/api/auth/google/callback",
        jsOrigin: "https://todo.agenticforce.io"
      });
      
      // Instead of fetching Google directly (which causes CORS errors), 
      // let's check if our backend is reachable
      const healthCheck = await fetch('/api/auth/status');
      console.log("Backend health check:", healthCheck.status, healthCheck.statusText);
      
      // Always return true - we'll let the backend handle any Google API issues
      return true;
    } catch (error) {
      console.error("Backend health check failed:", error);
      return false;
    }
  };
  
  const handleLogin = async () => {
    try {
      console.log("LoginButton: handleLogin called, isProduction:", isProduction);
      
      if (isProduction) {
        // Show loading toast
        toast({
          title: "Redirecting to Google...",
          description: "Please wait while we redirect you to Google for authentication.",
        });
        
        // Skip verification and directly redirect to Google OAuth login
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