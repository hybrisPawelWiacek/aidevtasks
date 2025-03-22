import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Clone the response before reading it
    const clonedRes = res.clone();
    
    try {
      // Try to parse the response as JSON first
      const data = await clonedRes.json();
      console.error("API error response:", data);
      
      // Use the message from the JSON response if available
      const errorMessage = data.message || res.statusText;
      throw new Error(`${res.status}: ${errorMessage}`);
    } catch (e) {
      // If it's not JSON, fall back to text
      try {
        const text = await res.text();
        console.error("API error (non-JSON):", { status: res.status, text });
        throw new Error(`${res.status}: ${text || res.statusText}`);
      } catch (textError) {
        // If we couldn't even read text, just throw the status
        throw new Error(`${res.status}: ${res.statusText}`);
      }
    }
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options?: {
    method?: string;
    body?: any;
  }
): Promise<T> {
  const method = options?.method || 'GET';
  const data = options?.body;
  
  // Log request details for debugging
  console.log(`API Request: ${method} ${endpoint}`, data ? {
    dataType: typeof data,
    dataPreview: JSON.stringify(data).substring(0, 100) + (JSON.stringify(data).length > 100 ? '...' : '')
  } : 'No data');
  
  try {
    const res = await fetch(endpoint, {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        // Add a cache buster to avoid caching issues
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include", // This is crucial for including cookies
      mode: 'cors',
    });
    
    console.log(`API Response: ${res.status} ${res.statusText} for ${method} ${endpoint}`);
    
    // For debugging auth - clone the response before consuming it
    if (res.status === 401) {
      console.warn("Authentication failed, session may have expired or is invalid");
    }
    
    // Clone the response before checking it
    const resForCheck = res.clone();
    await throwIfResNotOk(resForCheck);
    
    // Parse JSON response
    try {
      const result = await res.json();
      return result as T;
    } catch (e) {
      console.error("Failed to parse response as JSON:", e);
      try {
        const text = await res.clone().text();
        console.log("Response as text:", text.substring(0, 200));
      } catch (textError) {
        console.error("Could not read response as text either:", textError);
      }
      throw new Error("Failed to parse response as JSON");
    }
  } catch (error) {
    console.error(`API Request failed: ${method} ${endpoint}`, error);
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
    
    try {
      const res = await fetch(url, {
        credentials: "include", // Always include credentials (cookies)
        headers: {
          // Add cache busting headers
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        mode: 'cors',
      });
      
      console.log(`Query Response: ${res.status} ${res.statusText} for ${url}`);
      
      // Handle 401 based on behavior option
      if (res.status === 401) {
        console.warn(`Authentication failed for ${url}: 401 Unauthorized`);
        
        // Try to get more info about the auth failure
        try {
          const errorData = await res.clone().json();
          console.error("Auth failure details:", errorData);
        } catch (e) {
          // Ignore errors from trying to read the response
        }
        
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
      }
      
      // Clone the response before checking it
      const resForCheck = res.clone();
      await throwIfResNotOk(resForCheck);
      
      try {
        const data = await res.json();
        return data;
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
        try {
          const text = await res.clone().text();
          console.log("Response as text:", text.substring(0, 200));
        } catch (textError) {
          console.error("Could not read response as text either:", textError);
        }
        throw new Error("Failed to parse response as JSON");
      }
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
