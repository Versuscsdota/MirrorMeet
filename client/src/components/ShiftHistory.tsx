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

  // Перезагружаем историю каждые 5 секунд для обновления данных
  useEffect(() => {
    const interval = setInterval(() => {
      loadShiftHistory();
    }, 5000);

    return () => clearInterval(interval);
  }, [modelId, employeeId]);

  const loadShiftHistory = async () => {
    setLoading(true);
    try {
      // Загружаем реальные данные из API
      const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE || '/api';
      const response = await fetch(`${API_BASE_URL}/shifts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const { items: shifts } = await response.json();
        
        // Фильтруем завершенные смены и преобразуем в формат истории
        const completedShifts = shifts
          .filter((shift: any) => shift.status === 'completed')
          .filter((shift: any) => {
            if (modelId) {
              // Проверяем и по полю model (имя), и по modelId
              return shift.model === modelId || shift.modelId === modelId || 
                     (typeof shift.model === 'string' && shift.model.toLowerCase().includes(modelId.toLowerCase()));
            }
            if (employeeId) return shift.executor === employeeId || shift.responsible === employeeId;
            return true;
          })
          .map((shift: any) => ({
            id: shift.id,
            shiftId: shift.id,
            modelId: shift.modelId || shift.model,
            employeeId: shift.executor || shift.responsible,
            shiftType: shift.type || 'regular',
            date: shift.date,
            duration: shift.actualDuration ? Math.floor(shift.actualDuration / 60) : 0,
            earnings: shift.totalEarnings || 0,
            status: shift.status,
            producer: shift.responsible || shift.producer,
            executor: shift.executor,
            address: shift.address,
            room: shift.room,
            comment: shift.comment,
            createdAt: shift.createdAt
          }));

        setHistory(completedShifts);
      } else {
        console.error('Failed to load shifts');
        setHistory([]);
      }
    } catch (error) {
      console.error('Error loading shift history:', error);
      setHistory([]);
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
