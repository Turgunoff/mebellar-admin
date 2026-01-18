import api from './api';

export interface Region {
  id: number;
  name: string;
  name_jsonb?: { uz?: string; ru?: string; en?: string };
  code: string;
  is_active: boolean;
  ordering: number;
  created_at: string;
  updated_at?: string;
}

export interface CreateRegionRequest {
  name: { uz: string; ru?: string; en?: string };
  code: string;
  ordering?: number;
  is_active?: boolean;
}

export interface UpdateRegionRequest {
  name?: { uz?: string; ru?: string; en?: string };
  code?: string;
  ordering?: number;
  is_active?: boolean;
}

export interface RegionResponse {
  success: boolean;
  message?: string;
  region?: Region;
}

export interface RegionsResponse {
  success: boolean;
  message?: string;
  regions: Region[];
  count: number;
}

// Get all regions (admin)
export const getRegions = async (params?: {
  is_active?: boolean;
}): Promise<RegionsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.is_active !== undefined) {
    queryParams.append('is_active', params.is_active.toString());
  }

  const response = await api.get<RegionsResponse>(
    `/admin/regions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  );
  return response.data;
};

// Create region
export const createRegion = async (data: CreateRegionRequest): Promise<RegionResponse> => {
  const response = await api.post<RegionResponse>('/admin/regions', data);
  return response.data;
};

// Update region
export const updateRegion = async (id: number, data: UpdateRegionRequest): Promise<RegionResponse> => {
  const response = await api.put<RegionResponse>(`/admin/regions/${id}`, data);
  return response.data;
};

// Delete region
export const deleteRegion = async (id: number): Promise<RegionResponse> => {
  const response = await api.delete<RegionResponse>(`/admin/regions/${id}`);
  return response.data;
};

// Toggle region status
export const toggleRegionStatus = async (id: number): Promise<RegionResponse> => {
  const response = await api.put<RegionResponse>(`/admin/regions/${id}/status`);
  return response.data;
};

export const regionService = {
  getRegions,
  createRegion,
  updateRegion,
  deleteRegion,
  toggleRegionStatus,
};

export default regionService;
