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
  
  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        // Add a cache buster to avoid caching issues
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      // Always send cookies cross-domain
      mode: 'cors',
    });
    
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
    
    try {
      const res = await fetch(url, {
        credentials: "include",
        headers: {
          // Add cache busting headers
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        // Always send cookies cross-domain
        mode: 'cors',
      });
      
      console.log(`Query Response: ${res.status} ${res.statusText} for ${url}`);
      
      // Handle 401 based on behavior option
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
