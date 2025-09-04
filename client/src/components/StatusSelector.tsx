import { useState } from 'react';
import { ModelStatus, StatusLabels } from '../types';

interface StatusSelectorProps {
  className?: string;
  selectedStatuses?: ModelStatus[];
  onMultiStatusChange?: (statuses: ModelStatus[]) => void;
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
    ModelStatus.OUR_REFUSAL,
    ModelStatus.ACCOUNT_REGISTERED
  ]
};

// Цвета для статусов (соответствуют цветам из легенды слотов)
export const statusColors: Record<ModelStatus, string> = {
  [ModelStatus.NOT_CONFIRMED]: '#cc0000',
  [ModelStatus.NO_SHOW]: '#ff6600',
  [ModelStatus.ARRIVED]: '#0066cc',
  [ModelStatus.CONFIRMED]: '#0066cc',
  [ModelStatus.DRAINED]: '#cc0000',
  [ModelStatus.REGISTERED]: '#339af0',
  [ModelStatus.ACCOUNT_REGISTERED]: '#00cc66',
  [ModelStatus.CANDIDATE_REFUSED]: '#cc6600',
  [ModelStatus.OUR_REFUSAL]: '#990000',
  [ModelStatus.THINKING]: '#998800'
};

export default function StatusSelector({ 
  className = '', 
  selectedStatuses = [],
  onMultiStatusChange
}: StatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Функция для определения группы статуса
  const getStatusGroup = (status: ModelStatus): keyof typeof statusGroups => {
    for (const [groupName, statuses] of Object.entries(statusGroups)) {
      if (statuses.includes(status)) {
        return groupName as keyof typeof statusGroups;
      }
    }
    return 'initial';
  };

  const handleStatusSelect = (status: ModelStatus) => {
    console.log('handleStatusSelect called with:', status);
    
    if (onMultiStatusChange) {
      const newStatuses = [...selectedStatuses];
      const statusGroup = getStatusGroup(status);
      
      // Проверяем, выбран ли уже этот статус
      const isCurrentlySelected = newStatuses.includes(status);
      console.log('isCurrentlySelected:', isCurrentlySelected, 'current statuses:', newStatuses);
      
      if (isCurrentlySelected) {
        // Убираем статус из выбранных
        const index = newStatuses.indexOf(status);
        newStatuses.splice(index, 1);
        console.log('Removed status, new array:', newStatuses);
      } else {
        // Убираем все статусы из той же группы
        const groupStatuses = statusGroups[statusGroup];
        groupStatuses.forEach(groupStatus => {
          const index = newStatuses.indexOf(groupStatus);
          if (index > -1) {
            newStatuses.splice(index, 1);
          }
        });
        
        // Добавляем новый статус
        newStatuses.push(status);
        console.log('Added status, new array:', newStatuses);
      }
      
      onMultiStatusChange(newStatuses);
    }
  };

  const isStatusSelected = (status: ModelStatus): boolean => {
    return selectedStatuses.includes(status);
  };

  const getSelectedCount = () => {
    return selectedStatuses.length;
  };

  const getSelectedStatusesText = () => {
    if (selectedStatuses.length === 0) return 'Выберите статусы';
    if (selectedStatuses.length === 1) return StatusLabels[selectedStatuses[0]];
    if (selectedStatuses.length <= 3) {
      return selectedStatuses.map(status => StatusLabels[status]).join(', ');
    }
    return `Выбрано: ${selectedStatuses.length}`;
  };

  const getTriggerStyle = () => {
    return {
      backgroundColor: getSelectedCount() > 0 ? '#339af0' : '#6c757d',
      color: '#fff'
    };
  };

  const getTriggerText = () => {
    return getSelectedStatusesText();
  };

  return (
    <div className={`status-selector multi-status-selector ${className}`}>
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
                  <div
                    key={status}
                    className={`status-dot-option ${isStatusSelected(status) ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleStatusSelect(status);
                    }}
                  >
                    <span 
                      className="status-dot"
                      style={{ backgroundColor: statusColors[status] }}
                    />
                    <span className="status-label">{StatusLabels[status]}</span>
                  </div>
                ))}
              </div>

              <div className="status-column">
                <h4>Процесс</h4>
                {statusGroups.process.map(status => (
                  <div
                    key={status}
                    className={`status-dot-option ${isStatusSelected(status) ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleStatusSelect(status);
                    }}
                  >
                    <span 
                      className="status-dot"
                      style={{ backgroundColor: statusColors[status] }}
                    />
                    <span className="status-label">{StatusLabels[status]}</span>
                  </div>
                ))}
              </div>

              <div className="status-column">
                <h4>Финальные</h4>
                {statusGroups.final.map(status => (
                  <div
                    key={status}
                    className={`status-dot-option ${isStatusSelected(status) ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleStatusSelect(status);
                    }}
                  >
                    <span 
                      className="status-dot"
                      style={{ backgroundColor: statusColors[status] }}
                    />
                    <span className="status-label">{StatusLabels[status]}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="status-selector-footer">
              <div className="selected-statuses">
                {selectedStatuses.map((status: ModelStatus) => (
                  <span 
                    key={status} 
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
          </div>
        </>
      )}
    </div>
  );
}

