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
  emailLogin: (email: string, password: string) => Promise<void>;
  register: (userData: { email: string; username: string; displayName: string; password: string; confirmPassword: string }) => Promise<void>;
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

  // Define response type for auth status
  type AuthStatusResponse = { user: User } | null;
  
  // Check auth status using TanStack Query v5 proper format
  const authStatusQuery = useQuery<AuthStatusResponse, Error>({
    queryKey: ["/api/auth/status"],
    queryFn: async () => {
      try {
        console.log("Checking authentication status...");
        const response = await fetch("/api/auth/status", {
          credentials: "include", // Critical for cross-domain cookies
          headers: {
            // Add cache busting headers
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
          mode: 'cors'
        });
        
        if (response.status === 401) {
          console.log("Not authenticated: 401 Unauthorized");
          return null;
        }
        
        if (!response.ok) {
          throw new Error(`Auth status check failed: ${response.statusText}`);
        }
        
        // Successfully authenticated
        const data = await response.json();
        console.log("Auth status check success, user data:", data.user ? "User present" : "No user data");
        return data;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Auth status check error:", errorMessage);
        throw new Error(errorMessage);
      }
    }
  });
  
  const isCheckingAuth = authStatusQuery.isLoading;
  const checkAuth = authStatusQuery.refetch;
  
  // Update user state when query data changes
  useEffect(() => {
    if (authStatusQuery.data && authStatusQuery.data.user) {
      setUser(authStatusQuery.data.user);
      console.log("User authenticated:", authStatusQuery.data.user);
    } else if (authStatusQuery.isSuccess) {
      console.log("No user data in auth status response");
      setUser(null);
    }
  }, [authStatusQuery.data, authStatusQuery.isSuccess]);

  // Google login mutation
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

  // Email login mutation
  const { mutateAsync: emailLoginMutation, isPending: isEmailLoggingIn } = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      try {
        console.log("API Request: POST /api/auth/login", { 
          dataType: "object",
          dataPreview: { email } // Don't log password
        });
        
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
          credentials: "include",
        });
        
        console.log(`API Response: ${response.status} ${response.statusText} for POST /api/auth/login`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Unable to parse error response" }));
          console.error("Login error response:", errorData);
          throw new Error(errorData.message || "Login failed");
        }
        
        const data = await response.json().catch(() => {
          console.error("Failed to parse JSON from successful login response");
          throw new Error("Invalid response format from server");
        });
        
        if (!data || !data.user) {
          console.error("Invalid user data in response:", data);
          throw new Error("Invalid user data received from server");
        }
        
        return data.user;
      } catch (error) {
        console.error("Login processing error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setUser(data);
      toast({
        title: "Logged in successfully",
        description: `Welcome back, ${data.displayName || data.username}!`,
      });
    },
    onError: (error) => {
      console.error("Login error details:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials or server error",
        variant: "destructive",
      });
    },
  });

  // Registration mutation
  const { mutateAsync: registerMutation, isPending: isRegistering } = useMutation({
    mutationFn: async (userData: { email: string; username: string; displayName: string; password: string; confirmPassword: string }) => {
      try {
        console.log("API Request: POST /api/auth/register", { 
          dataType: "object",
          dataPreview: { email: userData.email, username: userData.username, displayName: userData.displayName } // Don't log passwords
        });
        
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
          credentials: "include",
        });
        
        console.log(`API Response: ${response.status} ${response.statusText} for POST /api/auth/register`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Unable to parse error response" }));
          console.error("Registration error response:", errorData);
          throw new Error(errorData.message || "Registration failed");
        }
        
        const data = await response.json().catch(() => {
          console.error("Failed to parse JSON from successful registration response");
          throw new Error("Invalid response format from server");
        });
        
        if (!data || !data.user) {
          console.error("Invalid user data in registration response:", data);
          throw new Error("Invalid user data received from server");
        }
        
        return data.user;
      } catch (error) {
        console.error("Registration processing error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setUser(data);
      toast({
        title: "Registration successful",
        description: `Welcome, ${data.displayName || data.username}!`,
      });
    },
    onError: (error) => {
      console.error("Registration error details:", error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Could not create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const { mutateAsync: logoutMutation, isPending: isLoggingOut } = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/auth/logout");
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

  const emailLogin = async (email: string, password: string) => {
    await emailLoginMutation({ email, password });
  };

  const register = async (userData: { email: string; username: string; displayName: string; password: string; confirmPassword: string }) => {
    await registerMutation(userData);
  };

  const logout = async () => {
    await logoutMutation();
  };

  // Replaced with the more comprehensive isAuthLoading variable

  useEffect(() => {
    // Check auth status on mount and periodically refresh if needed
    const checkAuthentication = async () => {
      try {
        await checkAuth();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Failed to check authentication status:", errorMessage);
      }
    };

    // Set up a periodic check every 30 seconds to keep session alive and refresh auth state
    const intervalId = setInterval(checkAuthentication, 30000);

    // Clean up
    return () => clearInterval(intervalId);
  }, [checkAuth]);

  const isAuthLoading = isCheckingAuth || isGoogleInitializing || isLoggingIn || isLoggingOut || isEmailLoggingIn || isRegistering;

  return (
    <AuthContext.Provider value={{ user, isLoading: isAuthLoading, login, emailLogin, register, logout }}>
      {isAuthLoading && <LoadingIndicator isFullscreen />}
      {!user && !isAuthLoading && <AuthModal isOpen={true} />}
      {children}
    </AuthContext.Provider>
  );
};
