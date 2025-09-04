import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { StatusManager } from '../utils/statusManager';
import { ModelStatus } from '../types';

interface Account {
  site: string;
  login: string;
  password: string;
}

interface Model {
  id: string;
  name: string;
  status: ModelStatus;
  accounts: Account[];
  shiftsCount?: number;
  trainingShiftsCount?: number;
}

interface Employee {
  id: string;
  name: string;
  role: 'curator' | 'producer' | 'operator';
}

interface Shift {
  id: string;
  modelName: string;
  modelId?: string;
  producer: string;
  executor?: string;
  address: string;
  room: string;
  startDateTime: string;
  endDateTime: string;
  type: 'regular' | 'training';
  status: 'inactive' | 'pending' | 'active' | 'completed' | 'upcoming';
  comment?: string;
  screenshots?: string[];
  accounts?: Account[];
  createdAt: string;
  updatedAt: string;
}

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shift: any) => void;
  shift?: any;
  mode: 'create' | 'edit' | 'view';
}

const ShiftModal: React.FC<ShiftModalProps> = ({
  isOpen,
  onClose,
  onSave,
  shift,
  mode
}) => {
  const [formData, setFormData] = useState<Partial<Shift>>({
    modelName: '',
    producer: '',
    executor: '',
    address: '',
    room: '',
    startDateTime: '',
    endDateTime: '',
    type: 'regular',
    status: 'upcoming',
    comment: ''
  });

  const [modelAccounts, setModelAccounts] = useState<Account[]>([]);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showProducerDropdown, setShowProducerDropdown] = useState(false);
  const [showExecutorDropdown, setShowExecutorDropdown] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [producerSearch, setProducerSearch] = useState('');
  const [executorSearch, setExecutorSearch] = useState('');

  // Mock data
  const mockModels: Model[] = [
    { 
      id: '1', 
      name: 'Иванова Анна С.', 
      status: ModelStatus.REGISTERED, 
      shiftsCount: 0, 
      trainingShiftsCount: 0, 
      accounts: [
        { site: 'Instagram', login: '@ivanova_anna', password: '***' },
        { site: 'TikTok', login: '@anna_ivanova_model', password: '***' }
      ]
    },
    { 
      id: '2', 
      name: 'Мария Сидорова', 
      status: ModelStatus.TRAINING, 
      shiftsCount: 0, 
      trainingShiftsCount: 1, 
      accounts: [
        { site: 'Instagram', login: '@maria_sidorova', password: '***' }
      ]
    },
    { 
      id: '3', 
      name: 'Елена Козлова', 
      status: ModelStatus.CLOSED_TO_TEAM, 
      shiftsCount: 0, 
      trainingShiftsCount: 2, 
      accounts: [
        { site: 'Instagram', login: '@elena_kozlova', password: '***' },
        { site: 'OnlyFans', login: '@elena_model', password: '***' }
      ]
    },
    { 
      id: '4', 
      name: 'Ольга Иванова', 
      status: ModelStatus.READY_TO_WORK, 
      shiftsCount: 1, 
      trainingShiftsCount: 2, 
      accounts: [
        { site: 'Instagram', login: '@olga_ivanova', password: '***' }
      ]
    },
    { 
      id: '5', 
      name: 'Татьяна Смирнова', 
      status: ModelStatus.MODEL, 
      shiftsCount: 5, 
      trainingShiftsCount: 2, 
      accounts: [
        { site: 'Instagram', login: '@tatiana_smirnova', password: '***' },
        { site: 'OnlyFans', login: '@tatiana_model', password: '***' },
        { site: 'TikTok', login: '@tanya_model', password: '***' }
      ]
    }
  ];

  const mockEmployees: Employee[] = [
    { id: '1', name: 'Петров П.', role: 'curator' },
    { id: '2', name: 'Кузнецов И.', role: 'producer' },
    { id: '3', name: 'Никитин С.', role: 'producer' },
    { id: '4', name: 'Сидоров А.', role: 'operator' },
    { id: '5', name: 'Фролов Д.', role: 'operator' },
    { id: '6', name: 'Орлов В.', role: 'operator' }
  ];
  
  const addresses = [
    { value: 'ул. Примерная, д. 1', rooms: ['Комната 101', 'Комната 102', 'Комната 103'] },
    { value: 'ул. Образцовая, д. 25', rooms: ['Комната 201', 'Комната 202', 'Комната 203'] },
    { value: 'пр. Тестовый, д. 15', rooms: ['Комната 301', 'Комната 302'] }
  ];

  useEffect(() => {
    if (shift && mode !== 'create') {
      setFormData(shift);
      setModelSearch(shift.modelName || '');
      setProducerSearch(shift.producer || '');
      setExecutorSearch(shift.executor || '');
      
      // Load model accounts
      const model = mockModels.find(m => m.name === shift.modelName);
      if (model) {
        setModelAccounts(model.accounts);
      }
    } else {
      setFormData({
        modelName: '',
        producer: '',
        executor: '',
        address: '',
        room: '',
        startDateTime: '',
        endDateTime: '',
        type: 'regular',
        status: 'upcoming',
        comment: ''
      });
      setModelAccounts([]);
      setModelSearch('');
      setProducerSearch('');
      setExecutorSearch('');
    }
  }, [shift, mode, isOpen]);

  const handleInputChange = (field: keyof Shift, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleModelSelect = (modelName: string) => {
    setModelSearch(modelName);
    setFormData(prev => ({ ...prev, modelName }));
    setShowModelDropdown(false);
    
    // Load model accounts
    const model = mockModels.find(m => m.name === modelName);
    if (model) {
      setModelAccounts(model.accounts);
    }
  };

  const handleProducerSelect = (producer: string) => {
    setProducerSearch(producer);
    setFormData(prev => ({ ...prev, producer }));
    setShowProducerDropdown(false);
  };

  const handleExecutorSelect = (executor: string) => {
    setExecutorSearch(executor);
    setFormData(prev => ({ ...prev, executor }));
    setShowExecutorDropdown(false);
  };

  const handleAddressChange = (address: string) => {
    setFormData(prev => ({ ...prev, address, room: '' }));
  };

  const getAvailableRooms = () => {
    const selectedAddress = addresses.find(addr => addr.value === formData.address);
    return selectedAddress ? selectedAddress.rooms : [];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.modelName || !formData.producer || !formData.address || 
        !formData.room || !formData.startDateTime || !formData.endDateTime) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    const shiftData = {
      ...formData,
      accounts: modelAccounts,
      updatedAt: new Date().toISOString(),
      ...(mode === 'create' && { 
        id: Date.now().toString(),
        createdAt: new Date().toISOString() 
      })
    };

    onSave(shiftData);
    onClose();
    toast.success(mode === 'create' ? 'Смена создана' : 'Смена обновлена');
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'create': return 'Создание смены';
      case 'edit': return 'Редактирование смены';
      case 'view': return 'Просмотр смены';
      default: return 'Смена';
    }
  };

  // Filter models based on shift type
  const getAvailableModels = () => {
    return mockModels.filter(model => {
      const nameMatch = model.name.toLowerCase().includes(modelSearch.toLowerCase());
      const shiftType = formData.type || 'regular';
      const validation = StatusManager.canCreateShift(model.status, shiftType);
      return nameMatch && validation.allowed;
    });
  };

  // Filter employees based on shift type
  const getAvailableProducers = () => {
    if (formData.type === 'training') {
      // For training shifts: only curators
      return mockEmployees.filter(emp => 
        emp.role === 'curator' &&
        emp.name.toLowerCase().includes(producerSearch.toLowerCase())
      );
    } else {
      // For regular shifts: only producers
      return mockEmployees.filter(emp => 
        emp.role === 'producer' &&
        emp.name.toLowerCase().includes(producerSearch.toLowerCase())
      );
    }
  };

  const getAvailableOperators = () => {
    return mockEmployees.filter(emp => 
      emp.role === 'operator' &&
      emp.name.toLowerCase().includes(executorSearch.toLowerCase())
    );
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{getModalTitle()}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            {mode !== 'view' && (
              <div className="shift-type-selector">
                <div 
                  className={`type-selector ${formData.type === 'regular' ? 'active' : ''}`}
                  onClick={() => handleInputChange('type', 'regular')}
                >
                  Обычная
                </div>
                <div 
                  className={`type-selector ${formData.type === 'training' ? 'active' : ''}`}
                  onClick={() => handleInputChange('type', 'training')}
                >
                  Стажировочная
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Модель (ФИО) *</label>
              {mode === 'view' ? (
                <input type="text" className="form-input" value={formData.modelName} readOnly />
              ) : (
                <div className="searchable-select">
                  <input
                    type="text"
                    value={modelSearch}
                    onChange={(e) => {
                      setModelSearch(e.target.value);
                      setShowModelDropdown(true);
                    }}
                    onFocus={() => setShowModelDropdown(true)}
                    placeholder="Поиск модели..."
                    className="form-input"
                  />
                  {showModelDropdown && (
                    <div className="dropdown-options active">
                      {getAvailableModels().map((model) => (
                        <div
                          key={model.id}
                          className="option"
                          onClick={() => handleModelSelect(model.name)}
                        >
                          {model.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {modelAccounts.length > 0 && (
              <div className="form-group">
                <label className="form-label">Аккаунты модели</label>
                <div className="accounts-list active">
                  {modelAccounts.map((account, index) => (
                    <div key={index} className="account-item">
                      {account.login} ({account.site})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.type === 'regular' && (
              <div className="form-group">
                <label className="form-label">Оператор (ФИО)</label>
                {mode === 'view' ? (
                  <input type="text" className="form-input" value={formData.executor} readOnly />
                ) : (
                  <div className="searchable-select">
                    <input
                      type="text"
                      value={executorSearch}
                      onChange={(e) => {
                        setExecutorSearch(e.target.value);
                        setShowExecutorDropdown(true);
                      }}
                      onFocus={() => setShowExecutorDropdown(true)}
                      placeholder="Поиск оператора..."
                      className="form-input"
                    />
                    {showExecutorDropdown && (
                      <div className="dropdown-options active">
                        {getAvailableOperators().map((operator) => (
                          <div
                            key={operator.id}
                            className="option"
                            onClick={() => handleExecutorSelect(operator.name)}
                          >
                            {operator.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                {formData.type === 'training' ? 'Куратор (ФИ) *' : 'Продюсер (ФИ) *'}
              </label>
              {mode === 'view' ? (
                <input type="text" className="form-input" value={formData.producer} readOnly />
              ) : (
                <div className="searchable-select">
                  <input
                    type="text"
                    value={producerSearch}
                    onChange={(e) => {
                      setProducerSearch(e.target.value);
                      setShowProducerDropdown(true);
                    }}
                    onFocus={() => setShowProducerDropdown(true)}
                    placeholder={formData.type === 'training' ? 'Поиск куратора...' : 'Поиск продюсера...'}
                    className="form-input"
                  />
                  {showProducerDropdown && (
                    <div className="dropdown-options active">
                      {getAvailableProducers().map((employee) => (
                        <div
                          key={employee.id}
                          className="option"
                          onClick={() => handleProducerSelect(employee.name)}
                        >
                          {employee.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Адрес *</label>
              {mode === 'view' ? (
                <input type="text" className="form-input" value={formData.address} readOnly />
              ) : (
                <select
                  className="form-select"
                  value={formData.address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                >
                  <option value="">Выберите адрес</option>
                  {addresses.map((addr) => (
                    <option key={addr.value} value={addr.value}>
                      {addr.value}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Комната *</label>
              {mode === 'view' ? (
                <input type="text" className="form-input" value={formData.room} readOnly />
              ) : (
                <select
                  className="form-select"
                  value={formData.room}
                  onChange={(e) => handleInputChange('room', e.target.value)}
                  disabled={!formData.address}
                >
                  <option value="">
                    {formData.address ? 'Выберите комнату' : 'Сначала выберите адрес'}
                  </option>
                  {getAvailableRooms().map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Дата и время начала *</label>
              <input
                type="datetime-local"
                className="form-input"
                value={formData.startDateTime}
                onChange={(e) => handleInputChange('startDateTime', e.target.value)}
                readOnly={mode === 'view'}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Дата и время окончания *</label>
              <input
                type="datetime-local"
                className="form-input"
                value={formData.endDateTime}
                onChange={(e) => handleInputChange('endDateTime', e.target.value)}
                readOnly={mode === 'view'}
              />
            </div>

            {mode !== 'view' && (
              <div className="form-group">
                <label className="form-label">Комментарий</label>
                <textarea
                  className="comment-textarea"
                  value={formData.comment || ''}
                  onChange={(e) => handleInputChange('comment', e.target.value)}
                  placeholder="Необязательный комментарий..."
                />
              </div>
            )}
          </form>
        </div>

        {mode !== 'view' && (
          <div className="modal-footer">
            <button type="button" className="btn btn-cancel" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" onClick={handleSubmit}>
              {mode === 'create' ? 'Создать смену' : 'Сохранить изменения'}
            </button>
          </div>
        )}

        {mode === 'view' && (
          <div className="modal-footer">
            <button type="button" className="btn btn-cancel" onClick={onClose}>
              Закрыть
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftModal;
