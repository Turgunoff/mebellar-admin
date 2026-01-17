import api from './api';

export interface Seller {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  legal_name: string;
  tax_id: string;
  bank_account?: string;
  bank_name?: string;
  is_verified: boolean;
  shops_count: number;
  created_at: string;
}

export interface SellerDetail {
  seller_profile: {
    id: string;
    user_id: string;
    shop_name: string;
    slug: string;
    description?: string;
    logo_url?: string;
    banner_url?: string;
    legal_name?: string;
    tax_id?: string;
    bank_account?: string;
    bank_name?: string;
    support_phone?: string;
    address?: { uz?: string; ru?: string; en?: string };
    latitude?: number;
    longitude?: number;
    social_links?: any;
    working_hours?: any;
    is_verified: boolean;
    rating: number;
    created_at: string;
    updated_at: string;
  };
  user: {
    id: string;
    full_name: string;
    phone: string;
    email?: string;
    avatar_url?: string;
    role: string;
    created_at: string;
    updated_at: string;
  };
  shops: Shop[];
  shops_count: number;
}

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
  region_id?: string;
  working_hours?: any;
  is_active: boolean;
  is_verified: boolean;
  is_main: boolean;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface SellersResponse {
  success: boolean;
  message?: string;
  sellers: Seller[];
  total: number;
  page?: number;
  limit?: number;
}

export interface SellerDetailResponse {
  success: boolean;
  message?: string;
  seller?: SellerDetail;
}

export const sellerService = {
  // Get all sellers
  getSellers: async (params?: {
    page?: number;
    limit?: number;
    is_verified?: boolean;
  }): Promise<SellersResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.is_verified !== undefined)
      queryParams.append('is_verified', params.is_verified.toString());

    const response = await api.get<SellersResponse>(
      `/admin/sellers?${queryParams.toString()}`
    );
    return response.data;
  },

  // Get seller detail with shops
  getSellerDetail: async (id: string): Promise<SellerDetailResponse> => {
    const response = await api.get<SellerDetailResponse>(`/admin/sellers/${id}`);
    return response.data;
  },

  // Update seller verification status
  updateSellerStatus: async (
    id: string,
    isVerified: boolean
  ): Promise<{ success: boolean; message?: string }> => {
    const response = await api.put(`/admin/sellers/${id}/status`, {
      is_verified: isVerified,
    });
    return response.data;
  },
};
