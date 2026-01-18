import api from './api';

export interface Shop {
  id: string;
  seller_id: string;
  name: { uz?: string; ru?: string; en?: string };
  description?: { uz?: string; ru?: string; en?: string };
  address?: { uz?: string; ru?: string; en?: string };
  slug: string;
  logo_url?: string;
  banner_url?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  region_id?: number;
  region_name?: { uz?: string; ru?: string; en?: string }; // Region name from JOIN (JSONB)
  working_hours?: any;
  is_active: boolean;
  is_verified: boolean;
  is_main: boolean;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface CreateShopRequest {
  name: { uz: string; ru: string; en: string };
  description?: { uz?: string; ru?: string; en?: string };
  address?: { uz?: string; ru?: string; en?: string };
  phone?: string;
  region_id?: number;
  latitude?: number;
  longitude?: number;
  working_hours?: any;
  is_main?: boolean;
  is_active?: boolean;
}

export interface UpdateShopRequest {
  name?: { uz?: string; ru?: string; en?: string };
  description?: { uz?: string; ru?: string; en?: string };
  address?: { uz?: string; ru?: string; en?: string };
  phone?: string;
  region_id?: number;
  latitude?: number;
  longitude?: number;
  logo_url?: string;
  banner_url?: string;
  working_hours?: any;
  is_main?: boolean;
  is_active?: boolean;
}

export interface ShopsResponse {
  success: boolean;
  message?: string;
  shops: Shop[];
  count: number;
  page?: number;
  limit?: number;
}

export interface ShopResponse {
  success: boolean;
  message?: string;
  shop?: Shop;
}

export interface Region {
  id: number;
  name: string;
  code?: string;
  is_active: boolean;
  ordering: number;
}

export const shopService = {
  // Get all shops
  getShops: async (params?: {
    page?: number;
    limit?: number;
    seller_id?: string;
    region_id?: string;
    is_active?: boolean;
    is_verified?: boolean;
  }): Promise<ShopsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.seller_id) queryParams.append('seller_id', params.seller_id);
    if (params?.region_id) queryParams.append('region_id', params.region_id);
    if (params?.is_active !== undefined)
      queryParams.append('is_active', params.is_active.toString());
    if (params?.is_verified !== undefined)
      queryParams.append('is_verified', params.is_verified.toString());

    const response = await api.get<ShopsResponse>(
      `/admin/shops?${queryParams.toString()}`
    );
    return response.data;
  },

  // Create shop
  createShop: async (
    sellerId: string,
    data: CreateShopRequest
  ): Promise<ShopResponse> => {
    const response = await api.post<ShopResponse>(
      `/admin/shops?seller_id=${sellerId}`,
      data
    );
    return response.data;
  },

  // Update shop
  updateShop: async (
    id: string,
    data: UpdateShopRequest
  ): Promise<{ success: boolean; message?: string }> => {
    const response = await api.put(`/admin/shops/${id}`, data);
    return response.data;
  },

  // Verify shop
  verifyShop: async (
    id: string,
    isVerified: boolean
  ): Promise<{ success: boolean; message?: string }> => {
    const response = await api.put(`/admin/shops/${id}/verify`, {
      is_verified: isVerified,
    });
    return response.data;
  },

  // Get regions (for dropdown)
  getRegions: async (): Promise<{ success: boolean; regions: Region[] }> => {
    const response = await api.get('/regions');
    return response.data;
  },
};
