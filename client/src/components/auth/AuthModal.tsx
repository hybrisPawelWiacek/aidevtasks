import React from "react";
import { useAuth } from "./AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { LoginButton } from "./LoginButton";

interface AuthModalProps {
  isOpen: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen }) => {
  const { login } = useAuth();
  const { signIn, isSigningIn } = useGoogleAuth();

  const handleMockLogin = async () => {
    try {
      // This is for development only - in production we redirect to Google OAuth
      const user = await signIn();
      if (user) {
        await login(user.email!, user.displayName!, user.photoURL || undefined);
      }
    } catch (error) {
      console.error("Google login error:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <Card className="w-11/12 max-w-md">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to AI Dev Tasks</h2>
            <p className="text-gray-600">Sign in to manage your AI development learning journey</p>
          </div>
          
          <div className="flex justify-center">
            <LoginButton 
              onMockLogin={handleMockLogin}
              isProduction={import.meta.env.PROD} 
            />
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">By signing in, you agree to our terms and privacy policy</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
