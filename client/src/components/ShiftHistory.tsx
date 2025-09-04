import React, { useState, useEffect } from 'react';
import { ShiftHistory } from '../types';

interface ShiftHistoryProps {
  modelId?: string;
  employeeId?: string;
  title?: string;
}

const ShiftHistoryComponent: React.FC<ShiftHistoryProps> = ({ 
  modelId, 
  employeeId, 
  title = "История смен" 
}) => {
  const [history, setHistory] = useState<ShiftHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'regular' | 'training'>('all');

  useEffect(() => {
    loadShiftHistory();
  }, [modelId, employeeId]);

  const loadShiftHistory = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration
      const mockHistory: ShiftHistory[] = [
        {
          id: '1',
          shiftId: 'shift-1',
          modelId: modelId,
          employeeId: employeeId,
          shiftType: 'training',
          date: '2024-01-15',
          duration: 240,
          earnings: 0,
          status: 'completed',
          producer: 'Анна Иванова',
          executor: 'Петр Сидоров',
          address: 'ул. Пушкина, 10',
          room: 'Комната 1',
          comment: 'Первая тренировочная смена',
          createdAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          shiftId: 'shift-2',
          modelId: modelId,
          employeeId: employeeId,
          shiftType: 'training',
          date: '2024-01-20',
          duration: 300,
          earnings: 0,
          status: 'completed',
          producer: 'Анна Иванова',
          executor: 'Петр Сидоров',
          address: 'ул. Пушкина, 10',
          room: 'Комната 2',
          comment: 'Вторая тренировочная смена',
          createdAt: '2024-01-20T14:00:00Z'
        },
        {
          id: '3',
          shiftId: 'shift-3',
          modelId: modelId,
          employeeId: employeeId,
          shiftType: 'regular',
          date: '2024-01-25',
          duration: 480,
          earnings: 15000,
          status: 'completed',
          producer: 'Мария Петрова',
          executor: 'Иван Козлов',
          address: 'ул. Ленина, 5',
          room: 'Студия А',
          comment: 'Первая рабочая смена',
          createdAt: '2024-01-25T12:00:00Z'
        }
      ];

      // Filter by modelId or employeeId
      const filteredHistory = mockHistory.filter(item => {
        if (modelId) return item.modelId === modelId;
        if (employeeId) return item.employeeId === employeeId;
        return true;
      });

      setHistory(filteredHistory);
    } catch (error) {
      console.error('Error loading shift history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredHistory = () => {
    if (filter === 'all') return history;
    return history.filter(item => item.shiftType === filter);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getShiftTypeLabel = (type: 'regular' | 'training') => {
    return type === 'regular' ? 'Рабочая' : 'Стажировочная';
  };

  const getShiftTypeClass = (type: 'regular' | 'training') => {
    return type === 'regular' ? 'shift-type-regular' : 'shift-type-training';
  };

  if (loading) {
    return (
      <div className="shift-history-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка истории смен...</p>
      </div>
    );
  }

  return (
    <div className="shift-history">
      <div className="shift-history-header">
        <h3>{title}</h3>
        <div className="shift-history-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Все ({history.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'training' ? 'active' : ''}`}
            onClick={() => setFilter('training')}
          >
            Стажировочные ({history.filter(h => h.shiftType === 'training').length})
          </button>
          <button 
            className={`filter-btn ${filter === 'regular' ? 'active' : ''}`}
            onClick={() => setFilter('regular')}
          >
            Рабочие ({history.filter(h => h.shiftType === 'regular').length})
          </button>
        </div>
      </div>

      <div className="shift-history-content">
        {getFilteredHistory().length === 0 ? (
          <div className="empty-history">
            <i className="material-icons">history</i>
            <p>История смен пуста</p>
            <span>Смены будут отображаться здесь после их завершения</span>
          </div>
        ) : (
          <div className="history-list">
            {getFilteredHistory().map((item) => (
              <div key={item.id} className="history-item">
                <div className="history-item-header">
                  <div className="history-date">
                    <i className="material-icons">calendar_today</i>
                    <span>{formatDate(item.date)}</span>
                  </div>
                  <div className={`history-type ${getShiftTypeClass(item.shiftType)}`}>
                    {getShiftTypeLabel(item.shiftType)}
                  </div>
                </div>
                
                <div className="history-item-body">
                  <div className="history-details">
                    <div className="detail-row">
                      <span className="detail-label">Продолжительность:</span>
                      <span className="detail-value">{formatDuration(item.duration)}</span>
                    </div>
                    
                    {item.earnings !== undefined && item.earnings > 0 && (
                      <div className="detail-row">
                        <span className="detail-label">Заработок:</span>
                        <span className="detail-value earnings">{item.earnings.toLocaleString('ru-RU')} ₽</span>
                      </div>
                    )}
                    
                    <div className="detail-row">
                      <span className="detail-label">Продюсер:</span>
                      <span className="detail-value">{item.producer}</span>
                    </div>
                    
                    {item.executor && (
                      <div className="detail-row">
                        <span className="detail-label">Исполнитель:</span>
                        <span className="detail-value">{item.executor}</span>
                      </div>
                    )}
                    
                    <div className="detail-row">
                      <span className="detail-label">Адрес:</span>
                      <span className="detail-value">{item.address}, {item.room}</span>
                    </div>
                    
                    {item.comment && (
                      <div className="detail-row">
                        <span className="detail-label">Комментарий:</span>
                        <span className="detail-value">{item.comment}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftHistoryComponent;
