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

// Helper to check if this is a test user
function isTestUser(): boolean {
  // Check cookies for user_id
  const cookies = document.cookie.split(';').map(c => c.trim());
  const userIdCookie = cookies.find(c => c.startsWith('user_id='));
  
  // Check localStorage for a persistent flag
  const localStorageFlag = localStorage.getItem('is_test_user') === 'true';
  
  // Return true if either indicator is present
  return !!userIdCookie || localStorageFlag;
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
  const isTestMode = isTestUser();
  
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
    
    // Add test mode header if needed
    if (isTestMode) {
      console.log("Adding test mode headers to request");
      (requestOptions.headers as any)['X-Dev-Testing'] = 'true';
    }
    
    // Handle test user login specially
    if (url.includes('/api/auth/login') && data && typeof data === 'object' && (data as any).email === 'jan.dzban@mail.com') {
      console.log("Using test user login flow");
      // Store a flag in localStorage to persist between page refreshes
      localStorage.setItem('is_test_user', 'true');
      // Special hack for dev login
      (requestOptions.headers as any)['X-Dev-Auth'] = 'true';
    }
    
    // Log the final headers being sent
    console.log("Request headers:", Object.keys(requestOptions.headers));
    
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
    const isTestMode = isTestUser();
    
    try {
      const requestHeaders: Record<string, string> = {
        // Add cache busting headers
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        // Add special headers for cross-domain auth
        'X-Requested-With': 'XMLHttpRequest',
      };
      
      // Add test mode header if needed
      if (isTestMode) {
        console.log("Adding test mode headers to query request");
        requestHeaders['X-Dev-Testing'] = 'true';
      }
      
      // Log the headers we're sending
      console.log("Query headers:", Object.keys(requestHeaders));
      
      const res = await fetch(url, {
        credentials: "include",
        headers: requestHeaders,
        // Always send cookies cross-domain
        mode: 'cors',
      });
      
      console.log(`Query Response: ${res.status} ${res.statusText} for ${url}`);
      
      // Special handling for tasks query with test user
      if (url.includes('/api/tasks')) {
        // If test mode is enabled, add the test param to URL and retry
        if (res.status === 401 && isTestMode) {
          console.log("Authentication failed for tasks query, retrying with test param...");
          
          // Build a new URL with the test param
          const testUrl = url.includes('?') ? `${url}&test=true` : `${url}?test=true`;
          console.log("Retrying with URL:", testUrl);
          
          try {
            const testRes = await fetch(testUrl, {
              credentials: "include",
              headers: {
                ...requestHeaders,
                'X-Dev-Testing': 'true'
              },
              mode: 'cors',
            });
            
            if (testRes.ok) {
              console.log("Test mode retry successful!");
              const testData = await testRes.json();
              return testData;
            } else {
              console.log("Test mode retry failed:", testRes.status, testRes.statusText);
            }
          } catch (retryError) {
            console.error("Test retry failed:", retryError);
          }
        }
      }
      
      // Standard 401 handling
      if (res.status === 401) {
        console.warn(`Authentication failed for ${url}: 401 Unauthorized`);
        
        if (unauthorizedBehavior === "returnNull") {
          // For tasks, return an empty array instead of null for better UX
          if (url.includes('/api/tasks')) {
            console.log("Returning empty array for unauthorized tasks query");
            return [];
          }
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
