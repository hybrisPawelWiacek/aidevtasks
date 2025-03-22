import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Try to parse the response as JSON first
      const data = await res.json();
      console.error("API error response:", data);
      
      // Use the message from the JSON response if available
      const errorMessage = data.message || res.statusText;
      throw new Error(`${res.status}: ${errorMessage}`);
    } catch (e) {
      // If it's not JSON, fall back to text
      const text = await res.text();
      console.error("API error (non-JSON):", { status: res.status, text });
      throw new Error(`${res.status}: ${text || res.statusText}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Log request details for debugging
  console.log(`API Request: ${method} ${url}`, data ? {
    dataType: typeof data,
    dataPreview: JSON.stringify(data).substring(0, 100) + (JSON.stringify(data).length > 100 ? '...' : '')
  } : 'No data');
  
  // Check if we're in the production domain
  const isProduction = window.location.hostname === 'todo.agenticforce.io';
  
  try {
    const requestOptions = {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        // Add a cache buster to avoid caching issues
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        // Add special headers for cross-domain auth
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include" as RequestCredentials,
      // Always send cookies cross-domain
      mode: 'cors' as RequestMode,
    };
    
    // In development mode with test user, add special auth header
    if (isProduction) {
      // For production, add special handling
      console.log("Adding production-specific auth handling");
    } else if (url.includes('/api/auth/login') && data && typeof data === 'object' && (data as any).email === 'jan.dzban@mail.com') {
      console.log("Using test user login flow");
      // Special hack for dev login
      (requestOptions.headers as any)['X-Dev-Auth'] = 'true';
    }
    
    const res = await fetch(url, requestOptions);
    
    console.log(`API Response: ${res.status} ${res.statusText} for ${method} ${url}`);
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`API Request failed: ${method} ${url}`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    
    // Log query request for debugging
    console.log(`Query Request: ${url}`);
    
    // Check if we're in the production domain
    const isProduction = window.location.hostname === 'todo.agenticforce.io';
    
    try {
      const requestHeaders: Record<string, string> = {
        // Add cache busting headers
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        // Add special headers for cross-domain auth
        'X-Requested-With': 'XMLHttpRequest',
      };
      
      // Add production-specific headers
      if (isProduction) {
        console.log("Adding production-specific headers for query request");
      }
      
      const res = await fetch(url, {
        credentials: "include",
        headers: requestHeaders,
        // Always send cookies cross-domain
        mode: 'cors',
      });
      
      console.log(`Query Response: ${res.status} ${res.statusText} for ${url}`);
      
      // Special handling for tasks in development mode
      if (res.status === 401 && url.includes('/api/tasks')) {
        console.log("Authentication failed for tasks query, attempting recovery...");
        
        // For tasks endpoint, try a direct auth via login first
        if (!isProduction) {
          try {
            // Try to use test user login
            console.log("Attempting recovery with test user for tasks");
            
            // If unauthorized behavior is returnNull, just return empty array
            if (unauthorizedBehavior === "returnNull") {
              console.log("Returning empty array for unauthorized tasks query");
              return [];
            }
          } catch (recoveryError) {
            console.error("Recovery attempt failed:", recoveryError);
          }
        }
      }
      
      // Standard 401 handling
      if (res.status === 401) {
        console.warn(`Authentication failed for ${url}: 401 Unauthorized`);
        
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
      }
      
      await throwIfResNotOk(res);
      const data = await res.json();
      return data;
    } catch (error) {
      console.error(`Query failed: ${url}`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
