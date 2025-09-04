import { ModelStatus, StatusLabels } from '../types';

interface StatusSelectorProps {
  currentStatus: ModelStatus;
  onStatusSelect: (status: ModelStatus) => void;
  onClose: () => void;
}

export default function StatusSelector({ currentStatus, onStatusSelect, onClose }: StatusSelectorProps) {
  // Группируем статусы по колонкам для лучшей организации
  const statusGroups = {
    initial: [
      ModelStatus.NOT_CONFIRMED,
      ModelStatus.CONFIRMED,
      ModelStatus.THINKING
    ],
    process: [
      ModelStatus.ARRIVED,
      ModelStatus.NO_SHOW,
      ModelStatus.REGISTERED
    ],
    final: [
      ModelStatus.DRAINED,
      ModelStatus.CANDIDATE_REFUSED,
      ModelStatus.OUR_REFUSAL
    ]
  };

  const groupTitles = {
    initial: 'Начальные',
    process: 'В процессе',
    final: 'Финальные'
  };

  return (
    <div className="modal status-selector-modal">
      <div className="modal-content status-selector">
        <div className="modal-header">
          <h3>Выбор статуса</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="current-status-info">
          <span>Текущий статус: </span>
          <span className={`status-badge status-${currentStatus}`}>
            {StatusLabels[currentStatus]}
          </span>
        </div>

        <div className="status-columns">
          {Object.entries(statusGroups).map(([groupKey, statuses]) => (
            <div key={groupKey} className="status-column">
              <div className="column-title">
                {groupTitles[groupKey as keyof typeof groupTitles]}
              </div>
              <div className="status-options">
                {statuses.map((status) => (
                  <button
                    key={status}
                    className={`status-option ${status === currentStatus ? 'current' : ''}`}
                    onClick={() => onStatusSelect(status)}
                  >
                    <span className={`status-badge status-${status}`}>
                      {StatusLabels[status]}
                    </span>
                    {status === currentStatus && (
                      <span className="current-indicator">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
