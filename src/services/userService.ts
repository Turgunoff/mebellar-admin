import api from './api';

export interface User {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  avatar_url?: string;
  role: string;
  onesignal_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface UsersResponse {
  success: boolean;
  message?: string;
  users: User[];
  total: number;
  page?: number;
  limit?: number;
}

// Get all users (assuming endpoint exists or using direct query)
// For now, we'll create a placeholder that can be updated when admin endpoint is available
export const getUsers = async (params?: {
  page?: number;
  limit?: number;
  role?: string;
}): Promise<UsersResponse> => {
  // Note: This endpoint may need to be created in the backend
  // For now, returning empty array as placeholder
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.role) queryParams.append('role', params.role);

  try {
    const response = await api.get<UsersResponse>(
      `/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    return response.data;
  } catch (error: any) {
    // If endpoint doesn't exist, return empty response
    if (error.response?.status === 404) {
      return {
        success: true,
        users: [],
        total: 0,
      };
    }
    throw error;
  }
};
