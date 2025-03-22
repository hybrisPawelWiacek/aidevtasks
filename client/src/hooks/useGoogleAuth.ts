import { useState, useEffect } from "react";

interface GoogleUser {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Configure to detect production environment
// Always use import.meta.env.PROD instead of process.env for Vite projects
const isProduction = import.meta.env.PROD || window.location.hostname === 'todo.agenticforce.io';
const isProduction = import.meta.env.PROD || (import.meta.env.VITE_ENVIRONMENT === "production");

export function useGoogleAuth() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    // Short initialization delay
    const timeout = setTimeout(() => {
      setIsInitializing(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, []);

  const signIn = async (): Promise<GoogleUser> => {
    setIsSigningIn(true);
    
    try {
      console.log("Authentication mode:", isProduction ? "Production" : "Development");
      
      if (isProduction) {
        // In production, redirect to Google OAuth login endpoint
        window.location.href = "/api/auth/google/login";
        // The return statement below won't be reached in production
        // as the page will navigate away
      }
      
      // For development, simulate a mock login
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return a mock Google user for development only
      const mockUser: GoogleUser = {
        email: "dev@example.com",
        displayName: "Development User",
        photoURL: null,
      };
      
      return mockUser;
    } finally {
      if (!isProduction) {
        setIsSigningIn(false);
      }
    }
  };

  return {
    isInitializing,
    isSigningIn,
    signIn,
  };
}
