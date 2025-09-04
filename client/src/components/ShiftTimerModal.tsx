import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { shiftsAPI, modelsAPI } from '../services/api';

interface ShiftTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: any;
}

const ShiftTimerModal: React.FC<ShiftTimerModalProps> = ({
  isOpen,
  onClose,
  shift
}) => {
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [modelAccounts, setModelAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [accountEarnings, setAccountEarnings] = useState<{[key: string]: number}>({});

  // Cleanup function to clear interval when component unmounts
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  // Загрузка аккаунтов модели
  useEffect(() => {
    const loadModelAccounts = async () => {
      if (!shift?.model && !shift?.modelName) return;
      
      setLoading(true);
      try {
        const modelsData = await modelsAPI.getAll();
        const modelName = shift.model || shift.modelName;
        const model = modelsData.find((m: any) => m.name === modelName);
        
        if (model && model.accounts) {
          setModelAccounts(model.accounts);
        }
      } catch (error) {
        console.error('Error loading model accounts:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadModelAccounts();
    }
  }, [isOpen, shift]);

  // Проверка существующего активного таймера при открытии
  useEffect(() => {
    if (isOpen && shift) {
      console.log('Checking shift status on open:', shift);
      // Если смена уже активна и есть время начала
      if (shift.status === 'active' && shift.actualStartTime) {
        console.log('Restoring active timer with start time:', shift.actualStartTime);
        const existingStartTime = new Date(shift.actualStartTime);
        setStartTime(existingStartTime);
        setIsActive(true);
        setElapsedTime(Date.now() - existingStartTime.getTime());
      } else {
        console.log('Shift not active, resetting timer state');
        setIsActive(false);
        setStartTime(null);
        setElapsedTime(0);
      }
    }
  }, [isOpen, shift]);

  useEffect(() => {
    if (isActive && startTime) {
      const id = setInterval(() => {
        setElapsedTime(Date.now() - startTime.getTime());
      }, 1000);
      setIntervalId(id);
    } else if (!isActive && intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isActive, startTime]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    try {
      const now = new Date();
      console.log('Starting shift with time:', now.toISOString());
      
      // Обновляем статус смены на "активная" и сохраняем время начала
      const updateData = {
        status: 'active' as const,
        actualStartTime: now.toISOString()
      };
      
      console.log('Updating shift with data:', updateData);
      await shiftsAPI.update(shift.id, updateData);
      
      // Устанавливаем локальное состояние только после успешного обновления
      setStartTime(now);
      setIsActive(true);
      
      toast.success('Смена запущена');
    } catch (error) {
      console.error('Error starting shift:', error);
      toast.error('Ошибка запуска смены');
    }
  };

  const handleStop = async () => {
    try {
      const now = new Date();
      const duration = startTime ? Math.floor((now.getTime() - startTime.getTime()) / 1000) : 0;
      
      // Подсчитываем общий заработок
      const totalEarnings = Object.values(accountEarnings).reduce((sum, earning) => sum + (earning || 0), 0);
      
      setIsActive(false);
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      
      // Обновляем статус смены на "завершена" и сохраняем время окончания и заработок
      await shiftsAPI.update(shift.id, {
        status: 'completed',
        actualEndTime: now.toISOString(),
        actualDuration: duration,
        totalEarnings: totalEarnings
      });
      
      toast.success(`Смена завершена. Общий заработок: $${totalEarnings.toFixed(2)}`);
      onClose();
    } catch (error) {
      console.error('Error stopping shift:', error);
      toast.error('Ошибка завершения смены');
    }
  };

  const handleReset = async () => {
    try {
      setIsActive(false);
      setStartTime(null);
      setElapsedTime(0);
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      
      // Сбрасываем статус смены на pending
      await shiftsAPI.update(shift.id, {
        status: 'pending',
        actualStartTime: undefined,
        actualEndTime: undefined,
        actualDuration: undefined
      });
      
      toast.success('Таймер сброшен');
    } catch (error) {
      console.error('Error resetting shift:', error);
      toast.error('Ошибка сброса таймера');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active">
      <div className="modal shift-timer-modal">
        <div className="modal-header">
          <h2 className="modal-title">Выполнение смены</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="shift-info-summary">
            <h3>{shift?.model || shift?.modelName}</h3>
            <p className="shift-address">{shift?.address}, Комната {shift?.room}</p>
            <p className="shift-producer">Куратор: {shift?.responsible || shift?.producer}</p>
          </div>

          {modelAccounts.length > 0 && (
            <div className="model-accounts-section">
              <h4>Аккаунты модели</h4>
              {loading ? (
                <div className="loading-accounts">Загрузка аккаунтов...</div>
              ) : (
                <div className="accounts-grid">
                  {modelAccounts.map((account, index) => (
                    <div key={index} className="account-card">
                      <div className="account-site">{account.site}</div>
                      <div className="account-login">Логин: {account.login}</div>
                      <div className="account-password">Пароль: {account.password}</div>
                      <div className="account-earnings">
                        <label>Заработок ($):</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={accountEarnings[`${account.site}-${account.login}`] || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setAccountEarnings(prev => ({
                              ...prev,
                              [`${account.site}-${account.login}`]: value
                            }));
                          }}
                          className="earnings-input"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="timer-display">
            <div className="timer-time">
              {formatTime(elapsedTime)}
            </div>
            <div className="timer-status">
              {isActive ? (
                <span className="status-active">Смена активна</span>
              ) : (
                <span className="status-inactive">Смена не запущена</span>
              )}
            </div>
          </div>

          {/* Общий заработок */}
          {Object.keys(accountEarnings).length > 0 && (
            <div className="total-earnings-display">
              <h4>Общий заработок: ${Object.values(accountEarnings).reduce((sum, earning) => sum + (earning || 0), 0).toFixed(2)}</h4>
            </div>
          )}

          <div className="timer-controls">
            {!isActive ? (
              <button 
                className="btn btn-success btn-large"
                onClick={handleStart}
              >
                <i className="material-icons">play_arrow</i>
                Начать смену
              </button>
            ) : (
              <div className="active-controls">
                <button 
                  className="btn btn-danger btn-large"
                  onClick={handleStop}
                >
                  <i className="material-icons">stop</i>
                  Завершить смену
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={handleReset}
                >
                  <i className="material-icons">refresh</i>
                  Сбросить
                </button>
              </div>
            )}
          </div>

          {startTime && (
            <div className="shift-timestamps">
              <div className="timestamp-item">
                <span className="timestamp-label">Время начала:</span>
                <span className="timestamp-value">
                  {startTime.toLocaleString('ru-RU')}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-cancel" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShiftTimerModal;
