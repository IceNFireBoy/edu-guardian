// API client for notes
import { debug } from '../components/DebugPanel';

// Define common API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string; // Sometimes errors come in 'message' field
  count?: number;
  totalPages?: number;
  currentPage?: number;
  // Allow any other properties that might come with the response
  [key: string]: any;
}

// Get API base from environment or use a relative URL
const API_BASE_FROM_ENV: string = import.meta.env.VITE_API_URL || '';

export const getApiUrl = (): string => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    debug('[Frontend] Forcing API URL to http://localhost:5000 for local development');
    return 'http://localhost:5000';
  }
  if (API_BASE_FROM_ENV) {
    debug(`[Frontend] Using VITE_API_URL: ${API_BASE_FROM_ENV}`);
    return API_BASE_FROM_ENV;
  }
  debug('[Frontend] Using relative API URL for production/deployment');
  return ''; 
};

debug(`Using API base URL: ${getApiUrl()}`);

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Generic authenticated API call function
export async function callAuthenticatedApi<T = any>(
  endpoint: string,
  method: HttpMethod = 'GET',
  body: Record<string, any> | FormData | null = null
): Promise<ApiResponse<T>> {
  const apiUrl = getApiUrl();
  const url = `${apiUrl}${endpoint}`;
  const token = localStorage.getItem('userToken');

  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    if (body instanceof FormData) {
      // Don't set Content-Type for FormData; browser does it with boundary
      config.body = body;
    } else {
      headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(body);
    }
  }

  try {
    debug(`[Frontend] Calling authenticated API: ${method} ${url}`);
    if (body && !(body instanceof FormData)) { // Avoid logging large FormData
      debug("[Frontend] Request body:", body);
    } else if (body instanceof FormData) {
      debug("[Frontend] Request body is FormData (content not logged).");
    }

    const res = await fetch(url, config);
    const contentType = res.headers.get("content-type");

    let data: ApiResponse<T>;

    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const textResponse = await res.text();
      debug(`[Frontend] Received non-JSON response from ${method} ${url}:`, textResponse);
      if (!res.ok) {
        throw new Error(textResponse || `API request failed with status ${res.status}`);
      }
      // For successful non-JSON, adapt to ApiResponse structure
      // This case might need specific handling depending on expected non-JSON responses.
      // For now, assuming it's a simple text success.
      return { success: true, data: textResponse as any, _raw: true };
    }

    debug(`[Frontend] Raw API response from ${method} ${url}:`, data);

    if (!res.ok) {
      const errorMessage = data?.error || data?.message || `API request failed with status ${res.status}`;
      debug(`[Frontend] API error from ${method} ${url}:`, errorMessage);
      throw new Error(errorMessage);
    }

    // Ensure the response conforms to ApiResponse, even if backend doesn't explicitly send 'success'
    // If 'success' is not in data, but res.ok is true, we assume success.
    if (data.success === undefined && res.ok) {
        return { ...data, success: true } as ApiResponse<T>;
    }
    
    return data;

  } catch (err: any) {
    debug(`[Frontend] Error in callAuthenticatedApi to ${method} ${url}:`, err.message);
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      debug("[Frontend] Network error - check if the backend is running and accessible");
      debug("[Frontend] API URL being called:", url);
    }
    // Ensure the thrown error is an instance of Error
    if (err instanceof Error) {
        throw err;
    } else {
        throw new Error(String(err));
    }
  }
} 