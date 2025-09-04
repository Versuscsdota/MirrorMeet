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

export interface ModelLifecycleStats {
  totalSlots: number;
  confirmedSlots: number;
  arrivedModels: number;
  registeredModels: number;
  firstTrainingCompleted: number;
  secondTrainingCompleted: number;
  readyToWork: number;
  activeModels: number;
  conversionRates: {
    slotToConfirmed: number;
    confirmedToArrived: number;
    arrivedToRegistered: number;
    registeredToFirstTraining: number;
    firstToSecondTraining: number;
    secondTrainingToReady: number;
    readyToActive: number;
    overallConversion: number;
  };
}

export interface EarningsStats {
  totalEarnings: number;
  averageEarningsPerShift: number;
  averageEarningsPerModel: number;
  topEarningModels: Array<{
    modelName: string;
    totalEarnings: number;
    shiftsCount: number;
    averagePerShift: number;
  }>;
  earningsByPeriod: {
    daily: Record<string, number>;
    weekly: Record<string, number>;
    monthly: Record<string, number>;
  };
  shiftStats: {
    totalShifts: number;
    completedShifts: number;
    averageShiftDuration: number;
    totalHoursWorked: number;
  };
}

export interface EmployeeConversionStats {
  employeeId: string;
  employeeName: string;
  totalSlotsRegistered: number;
  confirmedSlots: number;
  arrivedModels: number;
  registeredModels: number;
  activeModels: number;
  conversionRates: {
    slotToConfirmed: number;
    confirmedToArrived: number;
    arrivedToRegistered: number;
    registeredToActive: number;
    overallConversion: number;
  };
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
  },

  // Get model lifecycle statistics
  async getModelLifecycleStats(): Promise<ModelLifecycleStats> {
    console.log('Fetching model lifecycle stats...');
    const response = await fetch(`${API_BASE}/analytics/lifecycle?t=${Date.now()}`, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    if (!response.ok) {
      console.error('Model lifecycle stats fetch failed:', response.status, response.statusText);
      throw new Error(`Failed to fetch model lifecycle stats: ${response.status}`);
    }
    const data = await response.json();
    console.log('Model lifecycle stats received:', data);
    return data;
  },

  // Get earnings statistics
  async getEarningsStats(): Promise<EarningsStats> {
    console.log('Fetching earnings stats...');
    const response = await fetch(`${API_BASE}/analytics/earnings?t=${Date.now()}`, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    if (!response.ok) {
      console.error('Earnings stats fetch failed:', response.status, response.statusText);
      throw new Error(`Failed to fetch earnings stats: ${response.status}`);
    }
    const data = await response.json();
    console.log('Earnings stats received:', data);
    return data;
  },

  // Get employee conversion statistics
  async getEmployeeConversionStats(): Promise<EmployeeConversionStats[]> {
    console.log('Fetching employee conversion stats...');
    const response = await fetch(`${API_BASE}/analytics/employee-conversion?t=${Date.now()}`, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    if (!response.ok) {
      console.error('Employee conversion stats fetch failed:', response.status, response.statusText);
      throw new Error(`Failed to fetch employee conversion stats: ${response.status}`);
    }
    const data = await response.json();
    console.log('Employee conversion stats received:', data);
    return data;
  }
};
