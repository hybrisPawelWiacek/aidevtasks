import { useState, useEffect } from "react";

interface GoogleUser {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export function useGoogleAuth() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    // Simulate initialization delay
    const timeout = setTimeout(() => {
      setIsInitializing(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  const signIn = async (): Promise<GoogleUser> => {
    setIsSigningIn(true);

    try {
      // In a real implementation, we would use the Google OAuth client
      // But for this demo, we'll simulate a successful login
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Return a mock Google user
      const mockUser: GoogleUser = {
        email: "user@example.com",
        displayName: "Demo User",
        photoURL: null,
      };

      return mockUser;
    } finally {
      setIsSigningIn(false);
    }
  };

  return {
    isInitializing,
    isSigningIn,
    signIn,
  };
}
