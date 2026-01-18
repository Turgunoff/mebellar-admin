import api from './api';

// ============================================
// Types
// ============================================

export interface AttributeOption {
  value: string;
  label: {
    uz: string;
    ru: string;
    en: string;
  };
}

export interface CategoryAttribute {
  id: string;
  category_id: string;
  key: string;
  type: 'text' | 'number' | 'dropdown' | 'switch';
  label: {
    uz: string;
    ru: string;
    en: string;
  };
  options?: AttributeOption[];
  is_required: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryAttributesResponse {
  success: boolean;
  message?: string;
  attributes: CategoryAttribute[];
  count: number;
}

export interface CategoryAttributeResponse {
  success: boolean;
  message?: string;
  attribute?: CategoryAttribute;
}

export interface CreateAttributeRequest {
  key: string;
  type: 'text' | 'number' | 'dropdown' | 'switch';
  label: {
    uz: string;
    ru: string;
    en: string;
  };
  options?: AttributeOption[];
  is_required: boolean;
  sort_order: number;
}

export interface UpdateAttributeRequest {
  key?: string;
  type?: 'text' | 'number' | 'dropdown' | 'switch';
  label?: {
    uz: string;
    ru: string;
    en: string;
  };
  options?: AttributeOption[];
  is_required?: boolean;
  sort_order?: number;
}

// ============================================
// API Functions
// ============================================

/**
 * Get all attributes for a category (Public endpoint)
 */
export const getCategoryAttributes = async (
  categoryId: string
): Promise<CategoryAttributesResponse> => {
  const response = await api.get<CategoryAttributesResponse>(
    `/categories/${categoryId}/attributes`
  );
  return response.data;
};

/**
 * Create a new category attribute (Admin only)
 */
export const createCategoryAttribute = async (
  categoryId: string,
  data: CreateAttributeRequest
): Promise<CategoryAttributeResponse> => {
  const response = await api.post<CategoryAttributeResponse>(
    `/admin/categories/${categoryId}/attributes`,
    data
  );
  return response.data;
};

/**
 * Update an existing category attribute (Admin only)
 */
export const updateCategoryAttribute = async (
  attributeId: string,
  data: UpdateAttributeRequest
): Promise<CategoryAttributeResponse> => {
  const response = await api.put<CategoryAttributeResponse>(
    `/admin/category-attributes/${attributeId}`,
    data
  );
  return response.data;
};

/**
 * Delete a category attribute (Admin only)
 */
export const deleteCategoryAttribute = async (
  attributeId: string
): Promise<{ success: boolean; message?: string }> => {
  const response = await api.delete<{ success: boolean; message?: string }>(
    `/admin/category-attributes/${attributeId}`
  );
  return response.data;
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get label in a specific language with fallback
 */
export const getAttributeLabel = (
  attribute: CategoryAttribute,
  lang: 'uz' | 'ru' | 'en' = 'uz'
): string => {
  if (attribute.label[lang]) {
    return attribute.label[lang];
  }
  // Fallback to 'uz'
  if (attribute.label.uz) {
    return attribute.label.uz;
  }
  return attribute.key;
};

/**
 * Get option label in a specific language with fallback
 */
export const getOptionLabel = (
  option: AttributeOption,
  lang: 'uz' | 'ru' | 'en' = 'uz'
): string => {
  if (option.label[lang]) {
    return option.label[lang];
  }
  // Fallback to 'uz'
  if (option.label.uz) {
    return option.label.uz;
  }
  return option.value;
};

/**
 * Validate attribute type
 */
export const isValidAttributeType = (
  type: string
): type is CategoryAttribute['type'] => {
  return ['text', 'number', 'dropdown', 'switch'].includes(type);
};

/**
 * Get default value for attribute type
 */
export const getDefaultValue = (type: CategoryAttribute['type']): any => {
  switch (type) {
    case 'switch':
      return false;
    case 'number':
      return '';
    case 'dropdown':
      return '';
    case 'text':
    default:
      return '';
  }
};

/**
 * Attribute type display names
 */
export const attributeTypeLabels: Record<CategoryAttribute['type'], string> = {
  text: 'Text Input',
  number: 'Number Input',
  dropdown: 'Dropdown Select',
  switch: 'Toggle Switch',
};
