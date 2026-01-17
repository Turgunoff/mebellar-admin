import api from './api';

export interface Category {
  id: string;
  parent_id?: string;
  name: string;
  slug?: string;
  icon_url?: string;
  is_active?: boolean;
  sort_order?: number;
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

// Create category with file upload
export const createCategory = async (data: {
  name: string;
  parent_id?: string;
  icon?: File | null;
  is_active?: boolean;
  sort_order?: number;
}): Promise<CategoryResponse> => {
  const formData = new FormData();
  formData.append('name', data.name);
  if (data.parent_id) {
    formData.append('parent_id', data.parent_id);
  }
  if (data.icon) {
    formData.append('icon', data.icon);
  }
  if (data.is_active !== undefined) {
    formData.append('is_active', data.is_active.toString());
  }
  if (data.sort_order !== undefined) {
    formData.append('sort_order', data.sort_order.toString());
  }

  const response = await api.post<CategoryResponse>('/admin/categories', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Update category with file upload
export const updateCategory = async (
  id: string,
  data: {
    name?: string;
    icon?: File | null;
    is_active?: boolean;
    sort_order?: number;
  }
): Promise<CategoryResponse> => {
  const formData = new FormData();
  if (data.name) {
    formData.append('name', data.name);
  }
  if (data.icon) {
    formData.append('icon', data.icon);
  }
  if (data.is_active !== undefined) {
    formData.append('is_active', data.is_active.toString());
  }
  if (data.sort_order !== undefined) {
    formData.append('sort_order', data.sort_order.toString());
  }

  const response = await api.put<CategoryResponse>(`/admin/categories/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Delete category
export const deleteCategory = async (id: string): Promise<{ success: boolean; message?: string }> => {
  const response = await api.delete<{ success: boolean; message?: string }>(`/categories/${id}`);
  return response.data;
};
