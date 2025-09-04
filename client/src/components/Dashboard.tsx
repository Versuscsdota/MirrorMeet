import { useState, useEffect } from 'react';
import { analyticsAPI, DashboardStats, ConversionStats, StatusAnalytics } from '../services/analyticsAPI';
import { ModelStatus } from '../types';
import toast from 'react-hot-toast';

const StatusLabels: Record<ModelStatus, string> = {
  [ModelStatus.NOT_CONFIRMED]: 'Не подтверждена',
  [ModelStatus.CONFIRMED]: 'Подтверждена',
  [ModelStatus.DRAINED]: 'Слита',
  [ModelStatus.CANDIDATE_REFUSED]: 'Отказ кандидата',
  [ModelStatus.OUR_REFUSAL]: 'Наш отказ',
  [ModelStatus.THINKING]: 'Думает',
  [ModelStatus.REGISTERED]: 'Зарегистрирована',
  [ModelStatus.NO_SHOW]: 'Не пришла',
  [ModelStatus.ARRIVED]: 'Пришла'
};

export default function Dashboard() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [conversionStats, setConversionStats] = useState<ConversionStats | null>(null);
  const [statusAnalytics, setStatusAnalytics] = useState<StatusAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leadsCount, setLeadsCount] = useState<number>(0);
  const [isEditingLeads, setIsEditingLeads] = useState(false);

  useEffect(() => {
    loadAnalytics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAnalytics = async () => {
    try {
      console.log('Starting analytics load...');
      setIsLoading(true);
      
      // Clear previous data to force re-render
      setDashboardStats(null);
      setConversionStats(null);
      setStatusAnalytics(null);
      
      // Test server connectivity first
      const healthResponse = await fetch('http://localhost:3001/api/health');
      if (!healthResponse.ok) {
        throw new Error('Server not responding');
      }
      console.log('Server health check passed');
      
      const [dashboard, conversion, status] = await Promise.all([
        analyticsAPI.getDashboardStats(),
        analyticsAPI.getConversionStats(),
        analyticsAPI.getStatusAnalytics()
      ]);
      
      console.log('All analytics data loaded successfully');
      setDashboardStats(dashboard);
      setConversionStats(conversion);
      setStatusAnalytics(status);
    } catch (error) {
      console.error('Analytics loading error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      toast.error(`Ошибка загрузки аналитики: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return '📈';
    if (current < previous) return '📉';
    return '➡️';
  };

  const getTrendText = (current: number, previous: number) => {
    const diff = current - previous;
    if (diff === 0) return 'без изменений';
    return diff > 0 ? `+${diff}` : `${diff}`;
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h2>📊 Аналитика</h2>
        <button className="btn btn-secondary" onClick={loadAnalytics}>
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
              {getTrendIcon(dashboardStats?.trends.modelsThisWeek || 0, dashboardStats?.trends.modelsLastWeek || 0)}
              {getTrendText(dashboardStats?.trends.modelsThisWeek || 0, dashboardStats?.trends.modelsLastWeek || 0)} за неделю
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📅</div>
          <div className="metric-content">
            <h3>{dashboardStats?.totalSlots || 0}</h3>
            <p>Всего слотов</p>
            <span className="metric-trend">
              {getTrendIcon(dashboardStats?.trends.slotsThisWeek || 0, dashboardStats?.trends.slotsLastWeek || 0)}
              {getTrendText(dashboardStats?.trends.slotsThisWeek || 0, dashboardStats?.trends.slotsLastWeek || 0)} за неделю
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <h3>{dashboardStats?.occupiedSlots || 0}</h3>
            <p>Занятых слотов</p>
            <span className="metric-trend">
              {Math.round(((dashboardStats?.occupiedSlots || 0) / (dashboardStats?.totalSlots || 1)) * 100)}% загрузка
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
              <div className="funnel-label">Слоты</div>
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
                  <div className="status-label">{StatusLabels[statusKey]}</div>
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
