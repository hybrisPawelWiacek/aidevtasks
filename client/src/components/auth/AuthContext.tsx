import React, { createContext, useState, useContext, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AuthModal } from "./AuthModal";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { useToast } from "@/hooks/use-toast";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, displayName: string, photoURL?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const { isInitializing: isGoogleInitializing } = useGoogleAuth();

  // Check auth status
  const { isLoading: isCheckingAuth, refetch: checkAuth } = useQuery({
    queryKey: ["/api/auth/status"],
    onSuccess: (data) => {
      if (data && data.user) {
        setUser(data.user);
      }
    },
    onError: () => {
      setUser(null);
    },
  });

  // Login mutation
  const { mutateAsync: loginMutation, isPending: isLoggingIn } = useMutation({
    mutationFn: async ({ email, displayName, photoURL }: { email: string; displayName: string; photoURL?: string }) => {
      const response = await apiRequest("POST", "/api/auth/google", { 
        email, 
        displayName, 
        photoURL 
      });
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data);
      toast({
        title: "Logged in successfully",
        description: `Welcome back, ${data.displayName || data.username}!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const { mutateAsync: logoutMutation, isPending: isLoggingOut } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return response.json();
    },
    onSuccess: () => {
      setUser(null);
      toast({
        title: "Logged out successfully",
        description: "You have been logged out",
      });
    },
    onError: (error) => {
      toast({
        title: "Logout failed",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    },
  });

  const login = async (email: string, displayName: string, photoURL?: string) => {
    await loginMutation({ email, displayName, photoURL });
  };

  const logout = async () => {
    await logoutMutation();
  };

  const isLoading = isCheckingAuth || isGoogleInitializing || isLoggingIn || isLoggingOut;

  useEffect(() => {
    // No need to check auth status on mount as the query will run automatically
    // But we might want to refresh the auth status after login/logout
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {isLoading && <LoadingIndicator isFullscreen />}
      {!user && !isLoading && <AuthModal isOpen={true} />}
      {children}
    </AuthContext.Provider>
  );
};
