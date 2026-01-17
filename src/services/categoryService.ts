import api from './api';

export interface Category {
  id: string;
  parent_id?: string;
  name: string;
  icon_url?: string;
  product_count?: number;
  sub_categories?: Category[];
}

export interface CategoriesResponse {
  success: boolean;
  message?: string;
  categories: Category[];
  count: number;
}

export interface CategoryResponse {
  success: boolean;
  message?: string;
  category?: Category;
}

// Get all categories (flat or nested)
export const getCategories = async (flat: boolean = false): Promise<CategoriesResponse> => {
  const response = await api.get<CategoriesResponse>(
    `/categories${flat ? '?flat=true' : ''}`
  );
  return response.data;
};

// Get category by ID
export const getCategoryById = async (id: string): Promise<CategoryResponse> => {
  const response = await api.get<CategoryResponse>(`/categories/${id}`);
  return response.data;
};

// Create category (assuming endpoint exists or will be created)
export const createCategory = async (data: {
  name: string;
  parent_id?: string;
  icon_url?: string;
}): Promise<CategoryResponse> => {
  const response = await api.post<CategoryResponse>('/categories', data);
  return response.data;
};

// Update category
export const updateCategory = async (
  id: string,
  data: {
    name?: string;
    parent_id?: string;
    icon_url?: string;
  }
): Promise<CategoryResponse> => {
  const response = await api.put<CategoryResponse>(`/categories/${id}`, data);
  return response.data;
};

// Delete category
export const deleteCategory = async (id: string): Promise<{ success: boolean; message?: string }> => {
  const response = await api.delete<{ success: boolean; message?: string }>(`/categories/${id}`);
  return response.data;
};
