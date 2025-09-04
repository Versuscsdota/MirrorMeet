import { useState, useEffect } from 'react';
import { ModelStatus, StatusLabels } from '../types';

interface StatusSelectorProps {
  currentStatus?: ModelStatus;
  onStatusChange?: (status: ModelStatus) => void;
  className?: string;
  multiSelect?: boolean;
  selectedStatuses?: {
    initial?: ModelStatus;
    process?: ModelStatus;
    final?: ModelStatus;
  };
  onMultiStatusChange?: (statuses: {
    initial?: ModelStatus;
    process?: ModelStatus;
    final?: ModelStatus;
  }) => void;
}

// Группировка статусов по колонкам
const statusGroups = {
  initial: [
    ModelStatus.NOT_CONFIRMED,
    ModelStatus.CONFIRMED,
    ModelStatus.DRAINED
  ],
  process: [
    ModelStatus.ARRIVED,
    ModelStatus.NO_SHOW,
    ModelStatus.REGISTERED
  ],
  final: [
    ModelStatus.THINKING,
    ModelStatus.CANDIDATE_REFUSED,
    ModelStatus.OUR_REFUSAL
  ]
};

// Цвета для статусов
const statusColors: Record<ModelStatus, string> = {
  [ModelStatus.NOT_CONFIRMED]: '#ff6b6b',
  [ModelStatus.NO_SHOW]: '#ff8787',
  [ModelStatus.ARRIVED]: '#51cf66',
  [ModelStatus.CONFIRMED]: '#339af0',
  [ModelStatus.DRAINED]: '#ffd43b',
  [ModelStatus.REGISTERED]: '#69db7c',
  [ModelStatus.CANDIDATE_REFUSED]: '#ff8787',
  [ModelStatus.OUR_REFUSAL]: '#ff6b6b',
  [ModelStatus.THINKING]: '#74c0fc'
};

export default function StatusSelector({ 
  currentStatus, 
  onStatusChange, 
  className = '', 
  multiSelect = false,
  selectedStatuses = {},
  onMultiStatusChange
}: StatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localSelectedStatuses, setLocalSelectedStatuses] = useState(selectedStatuses);

  // Синхронизируем локальное состояние с внешним
  useEffect(() => {
    setLocalSelectedStatuses(selectedStatuses);
  }, [selectedStatuses]);

  const handleStatusSelect = (status: ModelStatus) => {
    if (multiSelect && onMultiStatusChange) {
      // Определяем к какой группе относится статус
      let group: 'initial' | 'process' | 'final' | null = null;
      if (statusGroups.initial.includes(status)) group = 'initial';
      else if (statusGroups.process.includes(status)) group = 'process';
      else if (statusGroups.final.includes(status)) group = 'final';
      
      if (group) {
        setLocalSelectedStatuses(prevStatuses => {
          const newStatuses = { ...prevStatuses };
          // Если статус уже выбран в этой группе, убираем его
          if (newStatuses[group] === status) {
            delete newStatuses[group];
          } else {
            // Иначе выбираем новый статус в этой группе
            newStatuses[group] = status;
          }
          onMultiStatusChange(newStatuses);
          return newStatuses;
        });
      }
    } else if (onStatusChange) {
      onStatusChange(status);
    }
  };

  const isStatusSelected = (status: ModelStatus): boolean => {
    if (!multiSelect) return status === currentStatus;
    return Object.values(localSelectedStatuses).includes(status);
  };

  const getSelectedCount = () => {
    return Object.keys(localSelectedStatuses).length;
  };

  const getSelectedStatusesText = () => {
    const statuses = Object.values(localSelectedStatuses);
    if (statuses.length === 0) return 'Выберите статусы';
    if (statuses.length === 1) return StatusLabels[statuses[0]];
    if (statuses.length <= 3) {
      return statuses.map(status => StatusLabels[status]).join(', ');
    }
    return `Выбрано: ${statuses.length}`;
  };

  const getTriggerStyle = () => {
    if (multiSelect) {
      return {
        backgroundColor: getSelectedCount() > 0 ? '#339af0' : '#6c757d',
        color: '#fff'
      };
    }
    return currentStatus ? {
      backgroundColor: statusColors[currentStatus],
      color: '#fff'
    } : {
      backgroundColor: '#6c757d',
      color: '#fff'
    };
  };

  const getTriggerText = () => {
    if (multiSelect) {
      return getSelectedStatusesText();
    }
    return currentStatus ? StatusLabels[currentStatus] : 'Выберите статус';
  };

  return (
    <div className={`status-selector ${multiSelect ? 'multi-status-selector' : ''} ${className}`}>
      <button 
        className="status-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        style={getTriggerStyle()}
      >
        <span className="status-text">{getTriggerText()}</span>
        <span className="status-icon">⚙️</span>
      </button>

      {isOpen && (
        <>
          <div className="status-selector-overlay" onClick={() => setIsOpen(false)} />
          <div className="status-selector-dropdown">
            <div className="status-columns">
              <div className="status-column">
                <h4>Начальные</h4>
                {statusGroups.initial.map(status => (
                  <button
                    key={status}
                    className={`status-option ${isStatusSelected(status) ? 'active' : ''}`}
                    style={{ 
                      backgroundColor: statusColors[status],
                      color: '#fff'
                    }}
                    onClick={() => handleStatusSelect(status)}
                  >
                    {StatusLabels[status]}
                  </button>
                ))}
              </div>

              <div className="status-column">
                <h4>Процесс</h4>
                {statusGroups.process.map(status => (
                  <button
                    key={status}
                    className={`status-option ${isStatusSelected(status) ? 'active' : ''}`}
                    style={{ 
                      backgroundColor: statusColors[status],
                      color: '#fff'
                    }}
                    onClick={() => handleStatusSelect(status)}
                  >
                    {StatusLabels[status]}
                  </button>
                ))}
              </div>

              <div className="status-column">
                <h4>Финальные</h4>
                {statusGroups.final.map(status => (
                  <button
                    key={status}
                    className={`status-option ${isStatusSelected(status) ? 'active' : ''}`}
                    style={{ 
                      backgroundColor: statusColors[status],
                      color: '#fff'
                    }}
                    onClick={() => handleStatusSelect(status)}
                  >
                    {StatusLabels[status]}
                  </button>
                ))}
              </div>
            </div>
            
            {multiSelect && (
              <div className="status-selector-footer">
                <div className="selected-statuses">
                  {Object.entries(localSelectedStatuses).map(([group, status]) => (
                    <span 
                      key={group} 
                      className="selected-status-chip"
                      style={{ backgroundColor: statusColors[status] }}
                    >
                      {StatusLabels[status]}
                    </span>
                  ))}
                </div>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsOpen(false)}
                >
                  Применить ({getSelectedCount()})
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Экспорт цветов для использования в других компонентах
export { statusColors };
