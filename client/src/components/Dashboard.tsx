import { useState, useEffect } from 'react';
import { analyticsAPI, DashboardStats, ConversionStats, StatusAnalytics } from '../services/analyticsAPI';
import { ModelStatus } from '../types';
import toast from 'react-hot-toast';

const MODEL_STATUS_LABELS: Record<ModelStatus, string> = {
  [ModelStatus.NOT_CONFIRMED]: 'Не подтверждена',
  [ModelStatus.CONFIRMED]: 'Подтверждена',
  [ModelStatus.DRAINED]: 'Слита',
  [ModelStatus.CANDIDATE_REFUSED]: 'Отказ кандидата',
  [ModelStatus.OUR_REFUSAL]: 'Наш отказ',
  [ModelStatus.THINKING]: 'Думает',
  [ModelStatus.REGISTERED]: 'Зарегистрирована',
  [ModelStatus.ACCOUNT_REGISTERED]: 'Зарегистрирована',
  [ModelStatus.NO_SHOW]: 'Не пришла',
  [ModelStatus.ARRIVED]: 'Пришла'
};

const ANALYTICS_REFRESH_INTERVAL = 30000;
const SERVER_HEALTH_ENDPOINT = 'http://localhost:3001/api/health';

interface DashboardState {
  dashboardStats: DashboardStats | null;
  conversionStats: ConversionStats | null;
  statusAnalytics: StatusAnalytics | null;
  isLoading: boolean;
}

export default function Dashboard() {
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    dashboardStats: null,
    conversionStats: null,
    statusAnalytics: null,
    isLoading: true
  });

  useEffect(() => {
    loadAnalyticsData();
    
    const refreshInterval = setInterval(loadAnalyticsData, ANALYTICS_REFRESH_INTERVAL);
    return () => clearInterval(refreshInterval);
  }, []);

  const checkServerHealth = async (): Promise<void> => {
    const healthResponse = await fetch(SERVER_HEALTH_ENDPOINT);
    if (!healthResponse.ok) {
      throw new Error('Server not responding');
    }
  };

  const fetchAllAnalyticsData = async () => {
    const [dashboard, conversion, status] = await Promise.all([
      analyticsAPI.getDashboardStats(),
      analyticsAPI.getConversionStats(),
      analyticsAPI.getStatusAnalytics()
    ]);
    
    return { dashboard, conversion, status };
  };

  const loadAnalyticsData = async (): Promise<void> => {
    try {
      setDashboardState(prev => ({ ...prev, isLoading: true }));
      
      await checkServerHealth();
      const { dashboard, conversion, status } = await fetchAllAnalyticsData();
      
      setDashboardState({
        dashboardStats: dashboard,
        conversionStats: conversion,
        statusAnalytics: status,
        isLoading: false
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      toast.error(`Ошибка загрузки аналитики: ${errorMessage}`);
      setDashboardState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const calculateTrendIcon = (currentValue: number, previousValue: number): string => {
    if (currentValue > previousValue) return '📈';
    if (currentValue < previousValue) return '📉';
    return '➡️';
  };

  const formatTrendText = (currentValue: number, previousValue: number): string => {
    const difference = currentValue - previousValue;
    if (difference === 0) return 'без изменений';
    return difference > 0 ? `+${difference}` : `${difference}`;
  };

  const calculateOccupancyPercentage = (occupied: number, total: number): number => {
    return Math.round((occupied / Math.max(total, 1)) * 100);
  };

  if (dashboardState.isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const { dashboardStats, conversionStats, statusAnalytics } = dashboardState;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h2>📊 Аналитика</h2>
        <button className="btn btn-secondary" onClick={loadAnalyticsData}>
          🔄 Обновить
        </button>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <h3>{dashboardStats?.totalModels || 0}</h3>
            <p>Всего моделей</p>
            <span className="metric-trend">
              {calculateTrendIcon(dashboardStats?.trends.modelsThisWeek || 0, dashboardStats?.trends.modelsLastWeek || 0)}
              {formatTrendText(dashboardStats?.trends.modelsThisWeek || 0, dashboardStats?.trends.modelsLastWeek || 0)} за неделю
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📅</div>
          <div className="metric-content">
            <h3>{dashboardStats?.totalSlots || 0}</h3>
            <p>Всего слотов</p>
            <span className="metric-trend">
              {calculateTrendIcon(dashboardStats?.trends.slotsThisWeek || 0, dashboardStats?.trends.slotsLastWeek || 0)}
              {formatTrendText(dashboardStats?.trends.slotsThisWeek || 0, dashboardStats?.trends.slotsLastWeek || 0)} за неделю
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <h3>{dashboardStats?.occupiedSlots || 0}</h3>
            <p>Занятых слотов</p>
            <span className="metric-trend">
              {calculateOccupancyPercentage(dashboardStats?.occupiedSlots || 0, dashboardStats?.totalSlots || 0)}% загрузка
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-content">
            <h3>{dashboardStats?.conversionRate || 0}%</h3>
            <p>Конверсия</p>
            <span className="metric-trend">
              слот → регистрация
            </span>
          </div>
        </div>
      </div>

      {/* Today's Activity */}
      <div className="activity-section">
        <h3>📈 Активность сегодня</h3>
        <div className="activity-cards">
          <div className="activity-card">
            <div className="activity-number">{dashboardStats?.recentActivity.newModelsToday || 0}</div>
            <div className="activity-label">Новых моделей</div>
          </div>
          <div className="activity-card">
            <div className="activity-number">{dashboardStats?.recentActivity.newSlotsToday || 0}</div>
            <div className="activity-label">Новых слотов</div>
          </div>
          <div className="activity-card">
            <div className="activity-number">{dashboardStats?.recentActivity.completedSlotsToday || 0}</div>
            <div className="activity-label">Завершенных слотов</div>
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      {conversionStats && (
        <div className="conversion-section">
          <h3>🔄 Воронка конверсии</h3>
          <div className="conversion-funnel">
            <div className="funnel-step">
              <div className="funnel-number">{conversionStats.totalLeads}</div>
              <div className="funnel-label">Лиды</div>
              <div className="funnel-arrow">↓</div>
            </div>
            <div className="funnel-step">
              <div className="funnel-number">{conversionStats.confirmedSlots}</div>
              <div className="funnel-label">Расписание</div>
              <div className="funnel-percent">{conversionStats.conversionFunnel.leadToSlot}%</div>
              <div className="funnel-arrow">↓</div>
            </div>
            <div className="funnel-step">
              <div className="funnel-number">{conversionStats.arrivedModels}</div>
              <div className="funnel-label">Пришли</div>
              <div className="funnel-percent">{conversionStats.conversionFunnel.slotToArrival}%</div>
              <div className="funnel-arrow">↓</div>
            </div>
            <div className="funnel-step">
              <div className="funnel-number">{conversionStats.registeredModels}</div>
              <div className="funnel-label">Зарегистрированы</div>
              <div className="funnel-percent">{conversionStats.conversionFunnel.arrivalToRegistration}%</div>
            </div>
          </div>
          <div className="overall-conversion">
            Общая конверсия: <strong>{conversionStats.conversionFunnel.overallConversion}%</strong>
          </div>
        </div>
      )}

      {/* Status Distribution */}
      {statusAnalytics && (
        <div className="status-section">
          <h3>📊 Распределение по статусам</h3>
          <div className="status-grid">
            {Object.entries(statusAnalytics.statusCounts).map(([status, count]) => {
              const statusKey = status as ModelStatus;
              const percentage = statusAnalytics.statusPercentages[statusKey];
              const trend = statusAnalytics.statusTrends.find(t => t.status === statusKey);
              
              return (
                <div key={status} className={`status-card status-${status.toLowerCase()}`}>
                  <div className="status-count">{count}</div>
                  <div className="status-label">{MODEL_STATUS_LABELS[statusKey]}</div>
                  <div className="status-percentage">{percentage}%</div>
                  {trend && trend.change !== 0 && (
                    <div className="status-change">
                      {trend.change > 0 ? '+' : ''}{trend.change}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
