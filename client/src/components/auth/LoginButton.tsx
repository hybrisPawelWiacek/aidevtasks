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
  
  // Verify the Google API connection
  const verifyGoogleAPI = async () => {
    try {
      // First, let's try to access Google's OAuth endpoint without parameters to check connectivity
      const connectTest = await fetch('https://accounts.google.com/o/oauth2/v2/auth');
      console.log("Basic Google connectivity test:", connectTest.status, connectTest.statusText);
      
      if (connectTest.status >= 400) {
        console.error("Cannot connect to Google OAuth service at all - possible network issue");
        return false;
      }
      
      // Now let's test with our client ID to specifically check if it's valid
      const response = await fetch('https://accounts.google.com/o/oauth2/v2/auth?client_id=640277032312-n2amkdnbpupkfsvjk7ref40gep4o2qdn.apps.googleusercontent.com&response_type=code&scope=email&access_type=none&redirect_uri=https://todo.agentforce.io&prompt=none&login_hint=skip');
      
      console.log("Google API verification response:", response.status, response.statusText);
      
      // For debugging, also log the URL to see if it matches what's in Google Cloud Console
      console.log("Google OAuth configured URLs:", {
        clientId: "640277032312-n2amkdnbpupkfsvjk7ref40gep4o2qdn.apps.googleusercontent.com",
        redirectUri: "https://todo.agentforce.io/api/auth/google/callback",
        jsOrigin: "https://todo.agentforce.io"
      });
      
      return response.status < 400; // Consider it a success if status code is less than 400
    } catch (error) {
      console.error("Google API verification failed:", error);
      return false;
    }
  };
  
  const handleLogin = async () => {
    try {
      console.log("LoginButton: handleLogin called, isProduction:", isProduction);
      
      if (isProduction) {
        // Show loading toast
        toast({
          title: "Preparing login...",
          description: "Verifying connection to Google...",
        });
        
        // First, verify Google API connection
        const isGoogleAPIAccessible = await verifyGoogleAPI();
        
        if (!isGoogleAPIAccessible) {
          toast({
            variant: "destructive",
            title: "Connection Error",
            description: "Unable to connect to Google authentication service. This may be due to network issues or incorrect API credentials.",
          });
          return;
        }
        
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