// API client for notes.
//
// Thin wrapper over the shared axios instance (apiClient) so there is a SINGLE
// place that owns auth-token injection, 401/session handling and base-URL
// config. Previously this was a separate hand-rolled fetch wrapper, which meant
// two divergent request/error pipelines to keep in sync. It is kept as a named
// helper because it returns the raw `ApiResponse` body and supports FormData
// uploads + PATCH used throughout the notes feature.
import type { AxiosRequestConfig } from 'axios';
import { debug } from '../components/DebugPanel';
import apiClient from './apiClient';

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

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Generic authenticated API call. Endpoints are relative to the /api/v1 base,
// e.g. '/notes' or '/users/me/badges'.
export async function callAuthenticatedApi<T = any>(
  endpoint: string,
  method: HttpMethod = 'GET',
  body: Record<string, any> | FormData | null = null
): Promise<ApiResponse<T>> {
  const config: AxiosRequestConfig = { url: endpoint, method };

  // For GET requests, convert body/filters to query params. We build the query
  // string manually (rather than relying on axios' serializer) to preserve the
  // exact semantics the backend expects: skip empty values and repeat array
  // values as `key=a&key=b`.
  if (method === 'GET' && body && typeof body === 'object' && !(body instanceof FormData)) {
    const params = new URLSearchParams();
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, String(v)));
        } else {
          params.append(key, String(value));
        }
      }
    });
    const qs = params.toString();
    if (qs) {
      config.url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}${qs}`;
    }
  } else if (body instanceof FormData) {
    config.data = body;
    // Remove the default JSON content-type so the browser sets
    // multipart/form-data with the correct boundary.
    config.headers = { 'Content-Type': undefined } as any;
  } else if (body) {
    config.data = body;
  }

  try {
    debug(`[Frontend] Calling authenticated API: ${method} ${config.url}`);
    if (body instanceof FormData) {
      debug('[Frontend] Request body is FormData (content not logged).');
    } else if (body && method !== 'GET') {
      debug('[Frontend] Request body:', body);
    }

    const res = await apiClient.request<ApiResponse<T> | string>(config);
    const data = res.data;

    // Non-JSON success (e.g. a plain-text body)
    if (typeof data !== 'object' || data === null) {
      return { success: true, data: data as any, _raw: true };
    }

    // Ensure the response conforms to ApiResponse even if the backend didn't
    // explicitly send `success` (a 2xx implies success).
    if ((data as ApiResponse<T>).success === undefined) {
      return { ...(data as ApiResponse<T>), success: true };
    }

    return data as ApiResponse<T>;
  } catch (err: any) {
    // Surface the backend's real message where available.
    const serverMessage = err.response?.data?.error || err.response?.data?.message;
    const message = serverMessage || err.message || `API request failed`;
    debug(`[Frontend] Error in callAuthenticatedApi to ${method} ${config.url}:`, message);
    throw new Error(message);
  }
}

// Fetch all notes (for NoteViewer and other consumers)
export async function fetchNotes() {
  return callAuthenticatedApi('/notes', 'GET');
}
