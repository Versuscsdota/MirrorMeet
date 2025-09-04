import { ModelStatus } from '../types';

export interface DashboardStats {
  totalModels: number;
  totalSlots: number;
  occupiedSlots: number;
  conversionRate: number;
  statusDistribution: Record<ModelStatus, number>;
  recentActivity: {
    newModelsToday: number;
    newSlotsToday: number;
    completedSlotsToday: number;
  };
  trends: {
    modelsThisWeek: number;
    modelsLastWeek: number;
    slotsThisWeek: number;
    slotsLastWeek: number;
  };
}

export interface ConversionStats {
  totalLeads: number;
  confirmedSlots: number;
  arrivedModels: number;
  registeredModels: number;
  conversionFunnel: {
    leadToSlot: number;
    slotToArrival: number;
    arrivalToRegistration: number;
    overallConversion: number;
  };
}

export interface StatusAnalytics {
  statusCounts: Record<ModelStatus, number>;
  statusPercentages: Record<ModelStatus, number>;
  statusTrends: {
    status: ModelStatus;
    count: number;
    change: number;
  }[];
}

export interface PeriodAnalytics {
  summary: {
    totalModels: number;
    totalSlots: number;
    occupiedSlots: number;
    avgModelsPerDay: number;
    avgSlotsPerDay: number;
  };
  dailyBreakdown: Record<string, { models: number; slots: number; occupied: number }>;
  statusBreakdown: Record<ModelStatus, number>;
}

const API_BASE = 'http://localhost:3001/api';

export const analyticsAPI = {
  // Get dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    console.log('Fetching dashboard stats...');
    const response = await fetch(`${API_BASE}/analytics/dashboard?t=${Date.now()}`, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    if (!response.ok) {
      console.error('Dashboard stats fetch failed:', response.status, response.statusText);
      throw new Error(`Failed to fetch dashboard stats: ${response.status}`);
    }
    const data = await response.json();
    console.log('Dashboard stats received:', data);
    return data;
  },

  // Get conversion statistics
  async getConversionStats(): Promise<ConversionStats> {
    console.log('Fetching conversion stats...');
    const response = await fetch(`${API_BASE}/analytics/conversion?t=${Date.now()}`, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    if (!response.ok) {
      console.error('Conversion stats fetch failed:', response.status, response.statusText);
      throw new Error(`Failed to fetch conversion stats: ${response.status}`);
    }
    const data = await response.json();
    console.log('Conversion stats received:', data);
    return data;
  },

  // Get status analytics
  async getStatusAnalytics(): Promise<StatusAnalytics> {
    console.log('Fetching status analytics...');
    const response = await fetch(`${API_BASE}/analytics/status?t=${Date.now()}`, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    if (!response.ok) {
      console.error('Status analytics fetch failed:', response.status, response.statusText);
      throw new Error(`Failed to fetch status analytics: ${response.status}`);
    }
    const data = await response.json();
    console.log('Status analytics received:', data);
    return data;
  },

  // Get period analytics
  async getPeriodAnalytics(startDate: string, endDate: string): Promise<PeriodAnalytics> {
    console.log('Fetching period analytics...');
    const response = await fetch(`${API_BASE}/analytics/period?startDate=${startDate}&endDate=${endDate}`);
    if (!response.ok) {
      console.error('Period analytics fetch failed:', response.status, response.statusText);
      throw new Error(`Failed to fetch period analytics: ${response.status}`);
    }
    const data = await response.json();
    console.log('Period analytics received:', data);
    return data;
  }
};
