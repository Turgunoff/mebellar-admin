import api from './api';

export interface Product {
  id: string;
  shop_id?: string;
  category_id?: string;
  name: string;
  description: string;
  price: number;
  discount_price?: number;
  images: string[];
  specs?: Record<string, any>;
  variants?: Record<string, any>[];
  rating?: number;
  is_new?: boolean;
  is_popular?: boolean;
  is_active?: boolean;
  created_at: string;
  view_count?: number;
  sold_count?: number;
}

export interface ProductsResponse {
  success: boolean;
  message?: string;
  products: Product[];
  count: number;
}

export interface ProductResponse {
  success: boolean;
  message?: string;
  product?: Product;
}

// Get all products
export const getProducts = async (params?: {
  category_id?: string;
  is_new?: boolean;
  is_popular?: boolean;
}): Promise<ProductsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.category_id) queryParams.append('category_id', params.category_id);
  if (params?.is_new) queryParams.append('is_new', 'true');
  if (params?.is_popular) queryParams.append('is_popular', 'true');

  const response = await api.get<ProductsResponse>(
    `/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  );
  return response.data;
};

// Get product by ID
export const getProductById = async (id: string): Promise<ProductResponse> => {
  const response = await api.get<ProductResponse>(`/products/${id}`);
  return response.data;
};

// Create product (multipart/form-data)
// Note: Admin may need X-Shop-ID header - backend should handle admin access
export const createProduct = async (formData: FormData): Promise<ProductResponse> => {
  const response = await api.post<ProductResponse>('/seller/products', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Update product (multipart/form-data)
export const updateProduct = async (
  id: string,
  formData: FormData
): Promise<ProductResponse> => {
  const response = await api.put<ProductResponse>(`/seller/products/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Delete product
export const deleteProduct = async (id: string): Promise<{ success: boolean; message?: string }> => {
  const response = await api.delete<{ success: boolean; message?: string }>(
    `/seller/products/${id}`
  );
  return response.data;
};
