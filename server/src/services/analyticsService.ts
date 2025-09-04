import { modelDb, slotDb, shiftDb, analyticsDb, userDb } from '../db/database';
import { Model, Slot, ModelStatus, Shift, User } from '../types';

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

  // Get model lifecycle statistics
  static getModelLifecycleStats(): ModelLifecycleStats {
    const models = modelDb.getAll();
    const slots = slotDb.getAll();
    const shifts = shiftDb.getAll();

    // Count models by lifecycle stage
    const totalSlots = slots.length;
    const confirmedSlots = slots.filter(s => s.clientName || s.modelId).length;
    const arrivedModels = models.filter(m => m.status === ModelStatus.ARRIVED).length;
    const registeredModels = models.filter(m => m.status === ModelStatus.REGISTERED).length;
    
    // Count training completions based on shift history
    const trainingShifts = shifts.filter(s => s.type === 'training' && s.status === 'completed');
    const modelTrainingCounts = new Map<string, number>();
    
    trainingShifts.forEach(shift => {
      const count = modelTrainingCounts.get(shift.model) || 0;
      modelTrainingCounts.set(shift.model, count + 1);
    });

    const firstTrainingCompleted = Array.from(modelTrainingCounts.values()).filter(count => count >= 1).length;
    const secondTrainingCompleted = Array.from(modelTrainingCounts.values()).filter(count => count >= 2).length;
    
    const readyToWork = models.filter(m => m.status === ModelStatus.READY_TO_WORK).length;
    const activeModels = models.filter(m => m.status === ModelStatus.MODEL).length;

    // Calculate conversion rates
    const slotToConfirmed = totalSlots > 0 ? Math.round((confirmedSlots / totalSlots) * 100) : 0;
    const confirmedToArrived = confirmedSlots > 0 ? Math.round((arrivedModels / confirmedSlots) * 100) : 0;
    const arrivedToRegistered = arrivedModels > 0 ? Math.round((registeredModels / arrivedModels) * 100) : 0;
    const registeredToFirstTraining = registeredModels > 0 ? Math.round((firstTrainingCompleted / registeredModels) * 100) : 0;
    const firstToSecondTraining = firstTrainingCompleted > 0 ? Math.round((secondTrainingCompleted / firstTrainingCompleted) * 100) : 0;
    const secondTrainingToReady = secondTrainingCompleted > 0 ? Math.round((readyToWork / secondTrainingCompleted) * 100) : 0;
    const readyToActive = readyToWork > 0 ? Math.round((activeModels / readyToWork) * 100) : 0;
    const overallConversion = totalSlots > 0 ? Math.round((activeModels / totalSlots) * 100) : 0;

    return {
      totalSlots,
      confirmedSlots,
      arrivedModels,
      registeredModels,
      firstTrainingCompleted,
      secondTrainingCompleted,
      readyToWork,
      activeModels,
      conversionRates: {
        slotToConfirmed,
        confirmedToArrived,
        arrivedToRegistered,
        registeredToFirstTraining,
        firstToSecondTraining,
        secondTrainingToReady,
        readyToActive,
        overallConversion
      }
    };
  }

  // Get earnings statistics
  static getEarningsStats(): EarningsStats {
    const shifts = shiftDb.getAll();
    const models = modelDb.getAll();
    const completedShifts = shifts.filter(s => s.status === 'completed');

    // Calculate total earnings
    const totalEarnings = completedShifts.reduce((sum, shift) => sum + (shift.totalEarnings || 0), 0);
    const averageEarningsPerShift = completedShifts.length > 0 ? totalEarnings / completedShifts.length : 0;

    // Calculate earnings per model
    const modelEarnings = new Map<string, { total: number; shifts: number }>();
    completedShifts.forEach(shift => {
      const current = modelEarnings.get(shift.model) || { total: 0, shifts: 0 };
      modelEarnings.set(shift.model, {
        total: current.total + (shift.totalEarnings || 0),
        shifts: current.shifts + 1
      });
    });

    const activeModelsCount = Array.from(modelEarnings.keys()).length;
    const averageEarningsPerModel = activeModelsCount > 0 ? totalEarnings / activeModelsCount : 0;

    // Top earning models
    const topEarningModels = Array.from(modelEarnings.entries())
      .map(([modelName, data]) => ({
        modelName,
        totalEarnings: data.total,
        shiftsCount: data.shifts,
        averagePerShift: data.shifts > 0 ? data.total / data.shifts : 0
      }))
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .slice(0, 10);

    // Earnings by period
    const daily: Record<string, number> = {};
    const weekly: Record<string, number> = {};
    const monthly: Record<string, number> = {};

    completedShifts.forEach(shift => {
      const date = new Date(shift.date);
      const dayKey = shift.date;
      const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      daily[dayKey] = (daily[dayKey] || 0) + (shift.totalEarnings || 0);
      weekly[weekKey] = (weekly[weekKey] || 0) + (shift.totalEarnings || 0);
      monthly[monthKey] = (monthly[monthKey] || 0) + (shift.totalEarnings || 0);
    });

    // Shift statistics
    const totalShifts = shifts.length;
    const totalDuration = completedShifts.reduce((sum, shift) => {
      // Calculate duration from start and end times if available
      if (shift.start && shift.end) {
        const start = new Date(`${shift.date}T${shift.start}`);
        const end = new Date(`${shift.date}T${shift.end}`);
        return sum + ((end.getTime() - start.getTime()) / (1000 * 60)); // Convert to minutes
      }
      return sum;
    }, 0);
    const averageShiftDuration = completedShifts.length > 0 ? totalDuration / completedShifts.length : 0;

    return {
      totalEarnings,
      averageEarningsPerShift,
      averageEarningsPerModel,
      topEarningModels,
      earningsByPeriod: {
        daily,
        weekly,
        monthly
      },
      shiftStats: {
        totalShifts,
        completedShifts: completedShifts.length,
        averageShiftDuration,
        totalHoursWorked: totalDuration
      }
    };
  }

  // Get employee conversion statistics
  static getEmployeeConversionStats(): EmployeeConversionStats[] {
    const users = userDb.getAll();
    const slots = slotDb.getAll();
    const models = modelDb.getAll();

    return users
      .filter(user => user.status === 'active') // Only active employees
      .map(user => {
        // Get slots registered by this employee
        const employeeSlots = slots.filter(slot => slot.registeredBy === user.id);
        const totalSlotsRegistered = employeeSlots.length;

        // Count confirmed slots (slots with client name or model assigned)
        const confirmedSlots = employeeSlots.filter(slot => 
          slot.clientName || slot.modelId
        ).length;

        // Count models that arrived from this employee's slots
        const arrivedModels = employeeSlots.filter(slot => 
          slot.modelId && models.find(model => 
            model.id === slot.modelId && 
            (model.status === ModelStatus.ARRIVED || 
             model.status === ModelStatus.REGISTERED ||
             model.status === ModelStatus.READY_TO_WORK ||
             model.status === ModelStatus.MODEL)
          )
        ).length;

        // Count registered models from this employee's slots
        const registeredModels = employeeSlots.filter(slot => 
          slot.modelId && models.find(model => 
            model.id === slot.modelId && 
            (model.status === ModelStatus.REGISTERED ||
             model.status === ModelStatus.READY_TO_WORK ||
             model.status === ModelStatus.MODEL)
          )
        ).length;

        // Count active models from this employee's slots
        const activeModels = employeeSlots.filter(slot => 
          slot.modelId && models.find(model => 
            model.id === slot.modelId && 
            model.status === ModelStatus.MODEL
          )
        ).length;

        // Calculate conversion rates
        const slotToConfirmed = totalSlotsRegistered > 0 ? 
          Math.round((confirmedSlots / totalSlotsRegistered) * 100) : 0;
        const confirmedToArrived = confirmedSlots > 0 ? 
          Math.round((arrivedModels / confirmedSlots) * 100) : 0;
        const arrivedToRegistered = arrivedModels > 0 ? 
          Math.round((registeredModels / arrivedModels) * 100) : 0;
        const registeredToActive = registeredModels > 0 ? 
          Math.round((activeModels / registeredModels) * 100) : 0;
        const overallConversion = totalSlotsRegistered > 0 ? 
          Math.round((activeModels / totalSlotsRegistered) * 100) : 0;

        return {
          employeeId: user.id,
          employeeName: user.fullName || user.username,
          totalSlotsRegistered,
          confirmedSlots,
          arrivedModels,
          registeredModels,
          activeModels,
          conversionRates: {
            slotToConfirmed,
            confirmedToArrived,
            arrivedToRegistered,
            registeredToActive,
            overallConversion
          }
        };
      })
      .filter(stats => stats.totalSlotsRegistered > 0) // Only show employees with registered slots
      .sort((a, b) => b.conversionRates.overallConversion - a.conversionRates.overallConversion); // Sort by overall conversion
  }
}
