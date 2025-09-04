import { modelDb, slotDb, analyticsDb } from '../db/database';
import { Model, Slot, ModelStatus } from '../types';

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

export class AnalyticsService {
  
  // Get dashboard statistics
  static getDashboardStats(): DashboardStats {
    const models = modelDb.getAll();
    const slots = slotDb.getAll();
    
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Basic counts
    const totalModels = models.length;
    const totalSlots = slots.length;
    const occupiedSlots = slots.filter(s => s.clientName || s.modelId).length;
    const registeredModels = models.filter(m => m.status === ModelStatus.REGISTERED).length;
    
    // Conversion rate
    const conversionRate = occupiedSlots > 0 ? Math.round((registeredModels / occupiedSlots) * 100) : 0;
    
    // Status distribution
    const statusDistribution = Object.values(ModelStatus).reduce((acc, status) => {
      acc[status] = models.filter(m => m.status === status).length;
      return acc;
    }, {} as Record<ModelStatus, number>);
    
    // Recent activity (today)
    const newModelsToday = models.filter(m => m.createdAt.startsWith(today)).length;
    const newSlotsToday = slots.filter(s => s.createdAt.startsWith(today)).length;
    const completedSlotsToday = slots.filter(s => 
      s.date === today && (s.visitStatus === 'arrived' || s.status === ModelStatus.ARRIVED)
    ).length;
    
    // Trends (this week vs last week)
    const modelsThisWeek = models.filter(m => m.createdAt >= weekAgo).length;
    const modelsLastWeek = models.filter(m => 
      m.createdAt >= twoWeeksAgo && m.createdAt < weekAgo
    ).length;
    
    const slotsThisWeek = slots.filter(s => s.createdAt >= weekAgo).length;
    const slotsLastWeek = slots.filter(s => 
      s.createdAt >= twoWeeksAgo && s.createdAt < weekAgo
    ).length;
    
    return {
      totalModels,
      totalSlots,
      occupiedSlots,
      conversionRate,
      statusDistribution,
      recentActivity: {
        newModelsToday,
        newSlotsToday,
        completedSlotsToday
      },
      trends: {
        modelsThisWeek,
        modelsLastWeek,
        slotsThisWeek,
        slotsLastWeek
      }
    };
  }
  
  // Get conversion statistics
  static getConversionStats(): ConversionStats {
    const models = modelDb.getAll();
    const slots = slotDb.getAll();
    
    // Get manually entered leads count from settings, fallback to models count
    let totalLeads = analyticsDb.getLeadsCount();
    if (totalLeads === 0) {
      totalLeads = models.length; // Fallback to models count if not set
    }
    
    // For display: all slots (as requested)
    const totalSlots = slots.length;
    
    // For conversion calculation: slots with models + models without slots
    const slotsWithModels = slots.filter(s => s.modelId && s.modelId.trim() !== '').length;
    const modelsWithoutSlots = models.filter(m => !slots.some(s => s.modelId === m.id)).length;
    const actualConfirmedSlots = slotsWithModels + modelsWithoutSlots;
    
    // Count arrived: models with ARRIVED status + slots with ARRIVED status or visitStatus (without duplication)
    const arrivedModelIds = new Set();
    
    // Add models with ARRIVED status
    models.forEach(m => {
      if (m.status === ModelStatus.ARRIVED) {
        arrivedModelIds.add(`model_${m.id}`);
      }
    });
    
    // Add slots with ARRIVED status (only if not already counted as model)
    slots.forEach(s => {
      if ((s.status === ModelStatus.ARRIVED || s.visitStatus === 'arrived') && 
          (!s.modelId || !arrivedModelIds.has(`model_${s.modelId}`))) {
        arrivedModelIds.add(`slot_${s.id}`);
      }
    });
    
    const arrivedModels = arrivedModelIds.size;
    
    const registeredModels = models.filter(m => m.status === ModelStatus.REGISTERED).length;
    
    const leadToSlot = totalLeads > 0 ? Math.round((totalSlots / totalLeads) * 100) : 0;
    const slotToArrival = totalSlots > 0 ? Math.round((arrivedModels / totalSlots) * 100) : 0;
    const arrivalToRegistration = arrivedModels > 0 ? Math.round((registeredModels / arrivedModels) * 100) : 0;
    const overallConversion = totalLeads > 0 ? Math.round((registeredModels / totalLeads) * 100) : 0;
    
    return {
      totalLeads,
      confirmedSlots: totalSlots, // Show all slots as requested
      arrivedModels,
      registeredModels,
      conversionFunnel: {
        leadToSlot,
        slotToArrival,
        arrivalToRegistration,
        overallConversion
      }
    };
  }
  
  // Get status analytics
  static getStatusAnalytics(): StatusAnalytics {
    const models = modelDb.getAll();
    const slots = slotDb.getAll();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // Collect all statuses from models and slots without duplication
    const allStatuses = new Map<string, ModelStatus>();
    
    // Add model statuses (models have priority over slots for same entity)
    models.forEach(model => {
      allStatuses.set(`model_${model.id}`, model.status);
    });
    
    // Add slot statuses (including empty slots)
    slots.forEach(slot => {
      // Skip if this slot has a model that's already counted
      if (slot.modelId && allStatuses.has(`model_${slot.modelId}`)) {
        return;
      }
      
      // Determine slot status
      let slotStatus: ModelStatus;
      if (slot.status) {
        slotStatus = slot.status as ModelStatus;
      } else if (slot.visitStatus === 'arrived') {
        slotStatus = ModelStatus.ARRIVED;
      } else if (slot.visitStatus === 'no_show') {
        slotStatus = ModelStatus.NO_SHOW;
      } else if (slot.clientName && slot.clientName.trim() !== '') {
        slotStatus = ModelStatus.CONFIRMED;
      } else {
        // Empty slot - count as not confirmed
        slotStatus = ModelStatus.NOT_CONFIRMED;
      }
      
      allStatuses.set(`slot_${slot.id}`, slotStatus);
    });
    
    // Count statuses
    const statusCounts = Object.values(ModelStatus).reduce((acc, status) => {
      acc[status] = Array.from(allStatuses.values()).filter(s => s === status).length;
      return acc;
    }, {} as Record<ModelStatus, number>);
    
    // Calculate percentages
    const totalEntities = allStatuses.size;
    const statusPercentages = Object.entries(statusCounts).reduce((acc, [status, count]) => {
      acc[status as ModelStatus] = totalEntities > 0 ? Math.round((count / totalEntities) * 100) : 0;
      return acc;
    }, {} as Record<ModelStatus, number>);
    
    // Calculate trends (simplified for now)
    const statusTrends = Object.entries(statusCounts).map(([status, count]) => ({
      status: status as ModelStatus,
      count,
      change: count // Simplified - showing current count as change
    }));
    
    return {
      statusCounts,
      statusPercentages,
      statusTrends
    };
  }
  
  // Get period analytics
  static getPeriodAnalytics(dateFrom: string, dateTo: string) {
    const models = modelDb.getAll().filter(m => {
      const createdAt = new Date(m.createdAt);
      return createdAt >= new Date(dateFrom) && createdAt <= new Date(dateTo);
    });
    
    const slots = slotDb.getAll().filter(s => {
      return s.date >= dateFrom && s.date <= dateTo;
    });
    
    // Daily breakdown
    const dailyStats: Record<string, { models: number; slots: number; occupied: number }> = {};
    
    // Initialize all dates in range
    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dailyStats[dateStr] = { models: 0, slots: 0, occupied: 0 };
    }
    
    // Count models by creation date
    models.forEach(model => {
      const dateStr = model.createdAt.split('T')[0];
      if (dailyStats[dateStr]) {
        dailyStats[dateStr].models++;
      }
    });
    
    // Count slots by date
    slots.forEach(slot => {
      if (dailyStats[slot.date]) {
        dailyStats[slot.date].slots++;
        if (slot.clientName || slot.modelId) {
          dailyStats[slot.date].occupied++;
        }
      }
    });
    
    return {
      summary: {
        totalModels: models.length,
        totalSlots: slots.length,
        occupiedSlots: slots.filter(s => s.clientName || s.modelId).length,
        avgModelsPerDay: Math.round(models.length / Object.keys(dailyStats).length),
        avgSlotsPerDay: Math.round(slots.length / Object.keys(dailyStats).length)
      },
      dailyBreakdown: dailyStats,
      statusBreakdown: Object.values(ModelStatus).reduce((acc, status) => {
        acc[status] = models.filter(m => m.status === status).length;
        return acc;
      }, {} as Record<ModelStatus, number>)
    };
  }
}
