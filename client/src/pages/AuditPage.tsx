import { useState, useEffect } from 'react';
import { auditAPI } from '../services/api';
import { AuditLog } from '../types';
import { MobileTable } from '../components/MobileTable';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ProtectedRoute } from '../components/ProtectedRoute';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    action: '',
    userId: ''
  });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const { items } = await auditAPI.getAll(filters);
      setLogs(items);
    } catch (error) {
      toast.error('Ошибка загрузки логов');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    loadLogs();
  };

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      'user_login': 'Вход в систему',
      'user_register': 'Регистрация пользователя',
      'model_create': 'Создание модели',
      'model_update': 'Обновление модели',
      'model_delete': 'Удаление модели',
      'model_files_upload': 'Загрузка файлов модели',
      'model_slot_sync': 'Синхронизация модели и слота',
      'slot_create': 'Создание слота',
      'slot_update': 'Обновление слота',
      'slot_delete': 'Удаление слота',
      'slot_files_upload': 'Загрузка файлов слота',
      'slot_register_model': 'Регистрация модели из слота',
      'shift_create': 'Создание смены',
      'shift_update': 'Обновление смены',
      'shift_delete': 'Удаление смены',
      'shift_start': 'Запуск смены',
      'shift_complete': 'Завершение смены',
      'shift_reset': 'Сброс смены',
      'address_create': 'Создание адреса',
      'address_update': 'Обновление адреса',
      'address_delete': 'Удаление адреса',
      'role_update': 'Обновление роли'
    };
    return labels[action] || action;
  };

  const getEntityTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'model': 'Модель',
      'slot': 'Слот',
      'user': 'Пользователь',
      'shift': 'Смена',
      'address': 'Адрес',
      'role': 'Роль'
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute module="audit" permission="view">
      <div className="audit-page">
        <div className="page-header">
          <h2>Журнал аудита</h2>
        </div>

      <form onSubmit={handleFilter} className="card audit-filters">
        <div className="filters-grid">
          <div className="form-group">
            <label>От даты</label>
            <input
              type="datetime-local"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            />
          </div>
          
          <div className="form-group">
            <label>До даты</label>
            <input
              type="datetime-local"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            />
          </div>
          
          <div className="form-group">
            <label>Действие</label>
            <input
              type="text"
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              placeholder="Поиск по действию"
            />
          </div>
          
          <div className="form-group">
            <button type="submit" className="btn btn-primary">
              Применить фильтры
            </button>
          </div>
        </div>
      </form>

      {logs.length === 0 ? (
        <div className="empty-state">
          <h3>Нет записей</h3>
          <p>Журнал аудита пуст</p>
        </div>
      ) : (
        <>
          {/* Desktop table view */}
          <div className="card desktop-only">
            <table className="table">
              <thead>
                <tr>
                  <th>Время</th>
                  <th>Действие</th>
                  <th>Тип</th>
                  <th>ID объекта</th>
                  <th>IP</th>
                  <th>User Agent</th>
                  <th>Детали</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td>{format(new Date(log.timestamp), 'dd.MM.yyyy HH:mm:ss')}</td>
                    <td>{getActionLabel(log.action)}</td>
                    <td>{getEntityTypeLabel(log.entityType)}</td>
                    <td className="entity-id">{log.entityId.slice(0, 8)}...</td>
                    <td>{log.ip || '-'}</td>
                    <td className="user-agent" title={log.userAgent}>
                      {log.userAgent ? log.userAgent.slice(0, 30) + '...' : '-'}
                    </td>
                    <td>
                      {log.details && (
                        <details>
                          <summary>Показать</summary>
                          <pre>{JSON.stringify(log.details, null, 2)}</pre>
                        </details>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="mobile-only">
            <MobileTable
              data={logs}
              columns={[
                {
                  key: 'timestamp',
                  label: 'Время',
                  render: (value: string) => format(new Date(value), 'dd.MM.yyyy HH:mm')
                },
                {
                  key: 'action',
                  label: 'Действие',
                  render: (value: string) => <strong>{getActionLabel(value)}</strong>
                },
                {
                  key: 'entityType',
                  label: 'Тип',
                  render: (value: string) => getEntityTypeLabel(value)
                },
                {
                  key: 'ip',
                  label: 'IP',
                  render: (value: string) => value || '-'
                }
              ]}
              keyField="id"
              title={(row: AuditLog) => `${getActionLabel(row.action)} - ${getEntityTypeLabel(row.entityType)}`}
              status={(row: AuditLog) => ({
                label: format(new Date(row.timestamp), 'HH:mm'),
                className: 'info'
              })}
            />
          </div>
        </>
      )}
      </div>
    </ProtectedRoute>
  );
}
