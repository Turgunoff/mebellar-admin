import api from './api';

export interface OrderItem {
  id: string;
  order_id?: string;
  product_id?: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  price: number;
  created_at?: string;
}

export interface Order {
  id: string;
  shop_id: string;
  client_name: string;
  client_phone: string;
  client_address?: string;
  total_amount: number;
  delivery_price?: number;
  status: string;
  client_note?: string;
  seller_note?: string;
  items?: OrderItem[];
  items_count?: number;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
}

export interface OrdersResponse {
  success: boolean;
  message?: string;
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface OrderResponse {
  success: boolean;
  message?: string;
  order?: Order;
}

// Get all orders (for admin - using seller endpoint)
export const getOrders = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<OrdersResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);

  const response = await api.get<OrdersResponse>(
    `/seller/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  );
  return response.data;
};

// Get order by ID
export const getOrderById = async (id: string): Promise<OrderResponse> => {
  const response = await api.get<OrderResponse>(`/seller/orders/${id}`);
  return response.data;
};

// Update order status
export const updateOrderStatus = async (
  id: string,
  status: string,
  sellerNote?: string
): Promise<OrderResponse> => {
  const response = await api.put<OrderResponse>(`/seller/orders/${id}`, {
    status,
    seller_note: sellerNote,
  });
  return response.data;
};
