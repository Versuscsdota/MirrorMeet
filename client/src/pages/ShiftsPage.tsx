import React, { useState, useEffect } from 'react';
import { Shift } from '../types';
import { shiftsAPI } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { ProtectedRoute } from '../components/ProtectedRoute';
import ShiftModal from '../components/ShiftModal';
import toast from 'react-hot-toast';

const SHIFT_STATUSES = [
  { value: '', label: 'Все статусы' },
  { value: 'pending', label: 'Ожидает' },
  { value: 'active', label: 'Активна' },
  { value: 'completed', label: 'Завершена' },
  { value: 'inactive', label: 'Неактивна' }
];

const SHIFT_TYPES = [
  { value: '', label: 'Все типы' },
  { value: 'regular', label: 'Обычная' },
  { value: 'training', label: 'Стажировочная' }
];

const ShiftsPage: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [filteredShifts, setFilteredShifts] = useState<Shift[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  const { hasPermission } = usePermissions();

  useEffect(() => {
    loadShifts();
  }, []);

  useEffect(() => {
    filterShifts();
  }, [shifts, searchTerm, statusFilter, typeFilter]);

  const loadShifts = async () => {
    try {
      setLoading(true);
      const response = await shiftsAPI.getAll();
      setShifts(response.items);
    } catch (error) {
      console.error('Failed to load shifts:', error);
      toast.error('Не удалось загрузить смены');
    } finally {
      setLoading(false);
    }
  };

  const filterShifts = () => {
    let filtered = [...shifts];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(shift => 
        shift.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shift.producer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shift.executor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shift.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(shift => shift.status === statusFilter);
    }

    // Type filter
    if (typeFilter) {
      filtered = filtered.filter(shift => shift.type === typeFilter);
    }

    setFilteredShifts(filtered);
  };

  const handleCreateShift = () => {
    setSelectedShift(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditShift = (shift: Shift) => {
    setSelectedShift(shift);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleViewShift = (shift: Shift) => {
    setSelectedShift(shift);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleSaveShift = async (shiftData: any) => {
    try {
      if (modalMode === 'create') {
        await shiftsAPI.create(shiftData);
        toast.success('Смена создана успешно');
      } else if (modalMode === 'edit' && selectedShift) {
        await shiftsAPI.update(selectedShift.id, shiftData);
        toast.success('Смена обновлена успешно');
      }
      setSelectedShift(null);
      setIsModalOpen(false);
      loadShifts();
    } catch (error) {
      console.error('Failed to save shift:', error);
      toast.error('Не удалось сохранить смену');
    }
  };


  const handleDeleteShift = async (shiftId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту смену?')) {
      return;
    }

    try {
      await shiftsAPI.delete(shiftId);
      toast.success('Смена удалена успешно');
      loadShifts();
    } catch (error) {
      console.error('Failed to delete shift:', error);
      toast.error('Не удалось удалить смену');
    }
  };

  const getStatusLabel = (status: string) => {
    const statusObj = SHIFT_STATUSES.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  };

  const getTypeLabel = (type: string) => {
    const typeObj = SHIFT_TYPES.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Загрузка смен...</p>
      </div>
    );
  }

  return (
    <ProtectedRoute module="shifts" permission="view">
      <div className="shifts-page">
        <div className="page-header">
          <div className="header-left">
            <h1 className="page-title">Смены</h1>
            <div className="header-stats">
              <span className="stat">
                Всего: <strong>{shifts.length}</strong>
              </span>
              <span className="stat">
                Активных: <strong>{shifts.filter(s => s.status === 'active').length}</strong>
              </span>
            </div>
          </div>
          <div className="header-right">
            {hasPermission('shifts', 'create') && (
              <button 
                className="btn btn-primary"
                onClick={handleCreateShift}
              >
                <i className="material-icons">add</i>
                Создать смену
              </button>
            )}
          </div>
        </div>

        <div className="filters-section">
          <div className="search-container">
            <i className="material-icons">search</i>
            <input
              type="text"
              placeholder="Поиск по модели, ответственному, исполнителю или адресу..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-controls">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              {SHIFT_STATUSES.map((status: any) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="filter-select"
            >
              {SHIFT_TYPES.map((type: any) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="shifts-content">
          {filteredShifts.length === 0 ? (
            <div className="empty-state">
              <h3>Смены не найдены</h3>
              <p>
                {shifts.length === 0 
                  ? 'Пока нет созданных смен. Создайте первую смену.'
                  : 'Попробуйте изменить фильтры поиска.'
                }
              </p>
            </div>
          ) : (
            <div className="shifts-grid">
              {filteredShifts.map(shift => (
                <div key={shift.id} className="shift-card">
                  <div className="shift-header">
                    <h3 className="shift-model">{shift.model}</h3>
                    <span className={`shift-status status-${shift.status}`}>
                      {getStatusLabel(shift.status)}
                    </span>
                  </div>
                  
                  <div className="shift-details">
                    <div className="detail-row">
                      <i className="material-icons">person</i>
                      <span>Продюсер: {shift.producer}</span>
                    </div>
                    {shift.executor && (
                      <div className="detail-row">
                        <i className="material-icons">person_outline</i>
                        <span>Исполнитель: {shift.executor}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <i className="material-icons">event</i>
                      <span>Дата: {shift.date}</span>
                    </div>
                    <div className="detail-row">
                      <i className="material-icons">schedule</i>
                      <span>Время: {shift.time}</span>
                    </div>
                    <div className="detail-row">
                      <i className="material-icons">location_on</i>
                      <span>Адрес: {shift.address}</span>
                    </div>
                    {shift.totalEarnings && (
                      <div className="detail-row">
                        <i className="material-icons">attach_money</i>
                        <span>Заработок: ${shift.totalEarnings}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <i className="material-icons">category</i>
                      <span>Тип: {getTypeLabel(shift.type)}</span>
                    </div>
                  </div>

                  <div className="shift-actions">
                    <button 
                      className="btn btn-secondary"
                      onClick={() => handleViewShift(shift)}
                    >
                      <i className="material-icons">visibility</i>
                      Просмотр
                    </button>
                    {hasPermission('shifts', 'edit') && (
                      <button 
                        className="btn btn-outline"
                        onClick={() => handleEditShift(shift)}
                      >
                        <i className="material-icons">edit</i>
                        Редактировать
                      </button>
                    )}
                    {hasPermission('shifts', 'delete') && (
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleDeleteShift(shift.id)}
                      >
                        <i className="material-icons">delete</i>
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Simple modal placeholder - will be replaced with proper ShiftModal component */}
        {isModalOpen && (
          <ShiftModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveShift}
            shift={selectedShift}
            mode={modalMode}
          />
        )}
      </div>
    </ProtectedRoute>
  );
};

export default ShiftsPage;
