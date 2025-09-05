import { useState, useEffect } from 'react';
import { analyticsAPI, ModelLifecycleStats, EarningsStats, EmployeeConversionStats } from '../services/analyticsAPI';
import toast from 'react-hot-toast';

type TabType = 'conversion' | 'earnings' | 'employees';

const ANALYTICS_REFRESH_INTERVAL = 30000;

interface AnalyticsState {
  lifecycleStats: ModelLifecycleStats | null;
  earningsStats: EarningsStats | null;
  employeeStats: EmployeeConversionStats[] | null;
  isLoading: boolean;
  activeTab: TabType;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export default function Dashboard() {
  // Modern styled components using CSS-in-JS
  const styles = {
    analyticsPage: {
      padding: '2rem',
      maxWidth: '1400px',
      margin: '0 auto'
    } as React.CSSProperties,
    
    analyticsHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem'
    } as React.CSSProperties,
    
    title: {
      color: '#1f2937',
      margin: 0,
      fontSize: '2rem',
      fontWeight: 600
    } as React.CSSProperties,
    
    tabNavigation: {
      display: 'flex',
      gap: '0.5rem',
      marginBottom: '2rem',
      borderBottomWidth: '1px',
      borderBottomStyle: 'solid',
      borderBottomColor: '#e5e7eb'
    } as React.CSSProperties,
    
    tabButton: {
      background: 'none',
      border: 'none',
      padding: '1rem 1.5rem',
      color: '#6b7280',
      fontSize: '1rem',
      fontWeight: 500,
      cursor: 'pointer',
      borderBottomWidth: '2px',
      borderBottomStyle: 'solid',
      borderBottomColor: 'transparent',
      transition: 'all 0.2s ease'
    } as React.CSSProperties,
    
    tabButtonActive: {
      color: '#3b82f6',
      borderBottomColor: '#3b82f6',
      background: 'rgba(59, 130, 246, 0.1)'
    } as React.CSSProperties,
    
    tabContent: {
      minHeight: '600px'
    } as React.CSSProperties,
    
    lifecycleFunnel: {
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '2rem',
      marginBottom: '2rem'
    } as React.CSSProperties,
    
    sectionTitle: {
      color: '#1f2937',
      margin: '0 0 1.5rem 0',
      fontSize: '1.5rem',
      fontWeight: 600
    } as React.CSSProperties,
    
    funnelContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      flexWrap: 'wrap',
      marginBottom: '1.5rem'
    } as React.CSSProperties,
    
    funnelStep: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      minWidth: '120px'
    } as React.CSSProperties,
    
    funnelNumber: {
      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      color: '#ffffff',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      padding: '1rem',
      borderRadius: '50%',
      width: '80px',
      height: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '0.5rem',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
    } as React.CSSProperties,
    
    funnelLabel: {
      color: '#1f2937',
      fontWeight: 600,
      marginTop: '0.5rem',
      fontSize: '0.85rem',
      textAlign: 'center'
    } as React.CSSProperties,
    
    funnelPercent: {
      color: '#10b981',
      fontWeight: 600,
      fontSize: '0.8rem',
      textAlign: 'center',
      marginTop: '0.25rem'
    } as React.CSSProperties,
    
    funnelArrow: {
      color: '#6b7280',
      fontSize: '1.5rem',
      margin: '0 0.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '30px'
    } as React.CSSProperties,
    
    overallConversion: {
      textAlign: 'center',
      color: '#1f2937',
      fontSize: '1.1rem',
      padding: '1rem',
      background: 'rgba(16, 185, 129, 0.1)',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      borderRadius: '8px'
    } as React.CSSProperties,
    
    conversionStrong: {
      color: '#10b981',
      fontSize: '1.3rem'
    } as React.CSSProperties,
    
    earningsMetrics: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    } as React.CSSProperties,
    
    earningsCard: {
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    } as React.CSSProperties,
    
    earningsIcon: {
      fontSize: '2.5rem',
      width: '60px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(34, 197, 94, 0.1)',
      borderRadius: '12px'
    } as React.CSSProperties,
    
    earningsAmount: {
      color: '#22c55e',
      margin: '0 0 0.25rem 0',
      fontSize: '1.8rem',
      fontWeight: 'bold'
    } as React.CSSProperties,
    
    earningsDescription: {
      color: '#6b7280',
      margin: 0,
      fontSize: '0.9rem'
    } as React.CSSProperties,
    
    shiftMetrics: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem'
    } as React.CSSProperties,
    
    shiftCard: {
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      padding: '1.5rem',
      textAlign: 'center'
    } as React.CSSProperties,
    
    shiftNumber: {
      color: '#f59e0b',
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem'
    } as React.CSSProperties,
    
    shiftLabel: {
      color: '#6b7280',
      fontSize: '0.9rem'
    } as React.CSSProperties,
    
    earnersList: {
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      overflow: 'hidden'
    } as React.CSSProperties,
    
    earnerItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '1rem 1.5rem',
      borderBottomWidth: '1px',
      borderBottomStyle: 'solid',
      borderBottomColor: 'rgba(255, 255, 255, 0.1)'
    } as React.CSSProperties,
    
    earnerItemLast: {
      borderBottomWidth: 0
    } as React.CSSProperties,
    
    earnerRank: {
      color: '#f59e0b',
      fontWeight: 'bold',
      fontSize: '1.1rem',
      minWidth: '40px'
    } as React.CSSProperties,
    
    earnerInfo: {
      flex: 1,
      marginLeft: '1rem'
    } as React.CSSProperties,
    
    earnerName: {
      color: '#1f2937',
      fontWeight: 500,
      marginBottom: '0.25rem'
    } as React.CSSProperties,
    
    earnerDetails: {
      color: '#6b7280',
      fontSize: '0.8rem'
    } as React.CSSProperties,
    
    earnerTotal: {
      color: '#22c55e',
      fontWeight: 'bold',
      fontSize: '1.1rem'
    } as React.CSSProperties,

    refreshButton: {
      background: '#3b82f6',
      color: '#ffffff',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: 500,
      transition: 'all 0.2s ease'
    } as React.CSSProperties,

    dateRangeContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      marginBottom: '1.5rem',
      padding: '1rem',
      background: 'rgba(59, 130, 246, 0.05)',
      border: '1px solid rgba(59, 130, 246, 0.1)',
      borderRadius: '8px'
    } as React.CSSProperties,

    dateInput: {
      padding: '0.5rem',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      fontSize: '0.9rem',
      color: '#1f2937'
    } as React.CSSProperties,

    dateLabel: {
      color: '#1f2937',
      fontSize: '0.9rem',
      fontWeight: 500
    } as React.CSSProperties,

    applyButton: {
      background: '#10b981',
      color: '#ffffff',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: 500,
      transition: 'all 0.2s ease'
    } as React.CSSProperties
  };

  const [analyticsState, setAnalyticsState] = useState<AnalyticsState>({
    lifecycleStats: null,
    earningsStats: null,
    employeeStats: null,
    isLoading: true,
    activeTab: 'conversion',
    dateRange: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 дней назад
      endDate: new Date().toISOString().split('T')[0] // сегодня
    }
  });

  useEffect(() => {
    loadAnalyticsData();
    
    const refreshInterval = setInterval(loadAnalyticsData, ANALYTICS_REFRESH_INTERVAL);
    return () => clearInterval(refreshInterval);
  }, []);

  const fetchAllAnalyticsData = async () => {
    const [lifecycle, earnings, employees] = await Promise.all([
      analyticsAPI.getModelLifecycleStats(),
      analyticsAPI.getEarningsStats(),
      analyticsAPI.getEmployeeConversionStats()
    ]);
    
    return { lifecycle, earnings, employees };
  };

  const loadAnalyticsData = async () => {
    try {
      setAnalyticsState(prev => ({ ...prev, isLoading: true }));
      const data = await fetchAllAnalyticsData();
      setAnalyticsState(prev => ({
        ...prev,
        lifecycleStats: data.lifecycle,
        earningsStats: data.earnings,
        employeeStats: data.employees,
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      toast.error(`Ошибка загрузки аналитики: ${errorMessage}`);
      setAnalyticsState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setAnalyticsState(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value
      }
    }));
  };

  const applyDateFilter = () => {
    loadAnalyticsData();
    toast.success(`Аналитика обновлена за период: ${analyticsState.dateRange.startDate} - ${analyticsState.dateRange.endDate}`);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}ч ${mins}м`;
  };

  if (analyticsState.isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        color: '#1f2937'
      }}>
        <div>Загрузка аналитики...</div>
      </div>
    );
  }

  const { lifecycleStats, earningsStats, activeTab } = analyticsState;

  const renderConversionTab = () => {
    if (!lifecycleStats) return null;

    return (
      <div>
        {/* Model Lifecycle Funnel */}
        <div style={styles.lifecycleFunnel}>
          <h3 style={styles.sectionTitle}>🔄 Воронка жизненного цикла модели</h3>
          <div style={styles.funnelContainer}>
            <div style={styles.funnelStep}>
              <div style={styles.funnelNumber}>{lifecycleStats.totalSlots}</div>
              <div style={styles.funnelLabel}>Всего слотов</div>
            </div>
            <div style={styles.funnelArrow}>→</div>
            <div style={styles.funnelStep}>
              <div style={styles.funnelNumber}>{lifecycleStats.confirmedSlots}</div>
              <div style={styles.funnelLabel}>Подтверждено</div>
              <div style={styles.funnelPercent}>{lifecycleStats.conversionRates.slotToConfirmed}%</div>
            </div>
            <div style={styles.funnelArrow}>→</div>
            <div style={styles.funnelStep}>
              <div style={styles.funnelNumber}>{lifecycleStats.arrivedModels}</div>
              <div style={styles.funnelLabel}>Пришли</div>
              <div style={styles.funnelPercent}>{lifecycleStats.conversionRates.confirmedToArrived}%</div>
            </div>
            <div style={styles.funnelArrow}>→</div>
            <div style={styles.funnelStep}>
              <div style={styles.funnelNumber}>{lifecycleStats.registeredModels}</div>
              <div style={styles.funnelLabel}>Зарегистрированы</div>
              <div style={styles.funnelPercent}>{lifecycleStats.conversionRates.arrivedToRegistered}%</div>
            </div>
          </div>
          <div style={styles.funnelContainer}>
            <div style={styles.funnelStep}>
              <div style={styles.funnelNumber}>{lifecycleStats.firstTrainingCompleted}</div>
              <div style={styles.funnelLabel}>1-я стажировка</div>
              <div style={styles.funnelPercent}>{lifecycleStats.conversionRates.registeredToFirstTraining}%</div>
            </div>
            <div style={styles.funnelArrow}>→</div>
            <div style={styles.funnelStep}>
              <div style={styles.funnelNumber}>{lifecycleStats.secondTrainingCompleted}</div>
              <div style={styles.funnelLabel}>2-я стажировка</div>
              <div style={styles.funnelPercent}>{lifecycleStats.conversionRates.firstToSecondTraining}%</div>
            </div>
            <div style={styles.funnelArrow}>→</div>
            <div style={styles.funnelStep}>
              <div style={styles.funnelNumber}>{lifecycleStats.readyToWork}</div>
              <div style={styles.funnelLabel}>Готова к работе</div>
              <div style={styles.funnelPercent}>{lifecycleStats.conversionRates.secondTrainingToReady}%</div>
            </div>
            <div style={styles.funnelArrow}>→</div>
            <div style={styles.funnelStep}>
              <div style={styles.funnelNumber}>{lifecycleStats.activeModels}</div>
              <div style={styles.funnelLabel}>Модели</div>
              <div style={styles.funnelPercent}>{lifecycleStats.conversionRates.readyToActive}%</div>
            </div>
          </div>
          <div style={styles.overallConversion}>
            Общая конверсия: <strong style={styles.conversionStrong}>{lifecycleStats.conversionRates.overallConversion}%</strong>
          </div>
        </div>
      </div>
    );
  };

  const renderEarningsTab = () => {
    if (!earningsStats) return null;

    return (
      <div>
        {/* Earnings Overview */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={styles.sectionTitle}>💰 Обзор заработка</h3>
          <div style={styles.earningsMetrics}>
            <div style={styles.earningsCard}>
              <div style={styles.earningsIcon}>💵</div>
              <div>
                <h3 style={styles.earningsAmount}>{formatCurrency(earningsStats.totalEarnings)}</h3>
                <p style={styles.earningsDescription}>Общий заработок</p>
              </div>
            </div>
            <div style={styles.earningsCard}>
              <div style={styles.earningsIcon}>📊</div>
              <div>
                <h3 style={styles.earningsAmount}>{formatCurrency(earningsStats.averageEarningsPerShift)}</h3>
                <p style={styles.earningsDescription}>Средний заработок за смену</p>
              </div>
            </div>
            <div style={styles.earningsCard}>
              <div style={styles.earningsIcon}>👤</div>
              <div>
                <h3 style={styles.earningsAmount}>{formatCurrency(earningsStats.averageEarningsPerModel)}</h3>
                <p style={styles.earningsDescription}>Средний заработок на модель</p>
              </div>
            </div>
          </div>
        </div>

        {/* Shift Statistics */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={styles.sectionTitle}>⏰ Статистика смен</h3>
          <div style={styles.shiftMetrics}>
            <div style={styles.shiftCard}>
              <div style={styles.shiftNumber}>{earningsStats.shiftStats.totalShifts}</div>
              <div style={styles.shiftLabel}>Всего смен</div>
            </div>
            <div style={styles.shiftCard}>
              <div style={styles.shiftNumber}>{earningsStats.shiftStats.completedShifts}</div>
              <div style={styles.shiftLabel}>Завершено смен</div>
            </div>
            <div style={styles.shiftCard}>
              <div style={styles.shiftNumber}>{formatDuration(earningsStats.shiftStats.averageShiftDuration)}</div>
              <div style={styles.shiftLabel}>Средняя длительность</div>
            </div>
            <div style={styles.shiftCard}>
              <div style={styles.shiftNumber}>{formatDuration(earningsStats.shiftStats.totalHoursWorked)}</div>
              <div style={styles.shiftLabel}>Всего отработано</div>
            </div>
          </div>
        </div>

        {/* Top Earning Models */}
        <div>
          <h3 style={styles.sectionTitle}>🏆 Топ моделей по заработку</h3>
          <div style={styles.earnersList}>
            {earningsStats.topEarningModels.map((model, index) => (
              <div key={model.modelName} style={{
                ...styles.earnerItem,
                ...(index === earningsStats.topEarningModels.length - 1 ? styles.earnerItemLast : {})
              }}>
                <div style={styles.earnerRank}>#{index + 1}</div>
                <div style={styles.earnerInfo}>
                  <div style={styles.earnerName}>{model.modelName}</div>
                  <div style={styles.earnerDetails}>
                    {model.shiftsCount} смен • {formatCurrency(model.averagePerShift)} за смену
                  </div>
                </div>
                <div style={styles.earnerTotal}>{formatCurrency(model.totalEarnings)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderEmployeesTab = () => {
    if (!analyticsState.employeeStats) return null;

    return (
      <div>
        {/* Employee Conversion Statistics */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={styles.sectionTitle}>👥 Конверсия по сотрудникам</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1rem',
            marginTop: '1rem'
          }}>
            {analyticsState.employeeStats.map((employee) => (
              <div key={employee.employeeId} style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: '#1f2937',
                  marginBottom: '0.5rem'
                }}>
                  {employee.employeeName}
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.5rem',
                    fontSize: '0.9rem'
                  }}>
                    <div style={{ color: '#6b7280' }}>
                      Слотов зарегистрировано: <strong style={{ color: '#1f2937' }}>{employee.totalSlotsRegistered}</strong>
                    </div>
                    <div style={{ color: '#6b7280' }}>
                      Подтверждено: <strong style={{ color: '#1f2937' }}>{employee.confirmedSlots}</strong>
                    </div>
                    <div style={{ color: '#6b7280' }}>
                      Пришли: <strong style={{ color: '#1f2937' }}>{employee.arrivedModels}</strong>
                    </div>
                    <div style={{ color: '#6b7280' }}>
                      Зарегистрированы: <strong style={{ color: '#1f2937' }}>{employee.registeredModels}</strong>
                    </div>
                    <div style={{ color: '#6b7280' }}>
                      Активные модели: <strong style={{ color: '#1f2937' }}>{employee.activeModels}</strong>
                    </div>
                    <div style={{ color: '#6b7280' }}>
                      Общая конверсия: <strong style={{ color: '#059669' }}>{employee.conversionRates.overallConversion}%</strong>
                    </div>
                  </div>
                </div>

                <div style={{
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '0.75rem',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Детализация конверсии:</div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.25rem'
                  }}>
                    <div style={{ color: '#6b7280' }}>
                      Слот → Подтверждение: <span style={{ color: '#1f2937' }}>{employee.conversionRates.slotToConfirmed}%</span>
                    </div>
                    <div style={{ color: '#6b7280' }}>
                      Подтверждение → Приход: <span style={{ color: '#1f2937' }}>{employee.conversionRates.confirmedToArrived}%</span>
                    </div>
                    <div style={{ color: '#6b7280' }}>
                      Приход → Регистрация: <span style={{ color: '#1f2937' }}>{employee.conversionRates.arrivedToRegistered}%</span>
                    </div>
                    <div style={{ color: '#6b7280' }}>
                      Регистрация → Активность: <span style={{ color: '#1f2937' }}>{employee.conversionRates.registeredToActive}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.analyticsPage}>
      <div style={styles.analyticsHeader}>
        <h2 style={styles.title}>📊 Аналитика</h2>
        <button style={styles.refreshButton} onClick={loadAnalyticsData}>
          🔄 Обновить
        </button>
      </div>

      {/* Tab Navigation */}
      {/* Date Range Filter */}
      <div style={styles.dateRangeContainer}>
        <span style={styles.dateLabel}>📅 Период анализа:</span>
        <span style={styles.dateLabel}>с</span>
        <input
          type="date"
          style={styles.dateInput}
          value={analyticsState.dateRange.startDate}
          onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
        />
        <span style={styles.dateLabel}>по</span>
        <input
          type="date"
          style={styles.dateInput}
          value={analyticsState.dateRange.endDate}
          onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
        />
        <button style={styles.applyButton} onClick={applyDateFilter}>
          ✅ Применить
        </button>
      </div>

      <div style={styles.tabNavigation}>
        <button 
          style={{
            ...styles.tabButton,
            ...(activeTab === 'conversion' ? styles.tabButtonActive : {})
          }}
          onClick={() => setAnalyticsState(prev => ({ ...prev, activeTab: 'conversion' }))}
        >
          🔄 Конверсия
        </button>
        <button 
          style={{
            ...styles.tabButton,
            ...(activeTab === 'earnings' ? styles.tabButtonActive : {})
          }}
          onClick={() => setAnalyticsState(prev => ({ ...prev, activeTab: 'earnings' }))}
        >
          💰 Заработок
        </button>
        <button 
          style={{
            ...styles.tabButton,
            ...(activeTab === 'employees' ? styles.tabButtonActive : {})
          }}
          onClick={() => setAnalyticsState(prev => ({ ...prev, activeTab: 'employees' }))}
        >
          👥 Сотрудники
        </button>
      </div>

      {/* Tab Content */}
      <div style={styles.tabContent}>
        {activeTab === 'conversion' && renderConversionTab()}
        {activeTab === 'earnings' && renderEarningsTab()}
        {activeTab === 'employees' && renderEmployeesTab()}
      </div>
    </div>
  );
}
