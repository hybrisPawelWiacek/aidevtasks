import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import { AuthProvider, useAuth } from "@/components/auth/AuthContext";
import { useEffect } from "react";

// Login error handler component
function LoginErrorHandler() {
  const [location] = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    // Check for error parameters in the URL when on the login page
    if (location.startsWith('/login')) {
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');
      
      if (error) {
        console.error("Login error:", error);
        toast({
          title: "Authentication Error",
          description: decodeURIComponent(error),
          variant: "destructive"
        });
        
        // Clean up URL params
        window.history.replaceState({}, document.title, '/login');
      }
    }
  }, [location, toast]);
  
  return null;
}

function Router() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  return (
    <>
      <LoginErrorHandler />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/login" component={Dashboard} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
