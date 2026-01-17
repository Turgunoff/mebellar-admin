import api from './api';

export interface DashboardStats {
  total_users: number;
  total_sellers: number;
  total_products: number;
  total_orders: number;
  total_revenue: number;
  active_users: number;
  pending_orders: number;
  completed_orders: number;
  last_updated: string;
}

export interface DashboardStatsResponse {
  success: boolean;
  message?: string;
  data?: DashboardStats;
}

// Get dashboard statistics
export const getDashboardStats = async (): Promise<DashboardStatsResponse> => {
  const response = await api.get<DashboardStatsResponse>('/admin/dashboard-stats');
  return response.data;
};
