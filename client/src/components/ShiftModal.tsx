import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { StatusManager } from '../utils/statusManager';
import { ModelStatus } from '../types';
import { modelsAPI, usersAPI, addressesAPI } from '../services/api';

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
    status: 'pending',
    comment: ''
  });

  const [modelAccounts, setModelAccounts] = useState<Account[]>([]);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showProducerDropdown, setShowProducerDropdown] = useState(false);
  const [showExecutorDropdown, setShowExecutorDropdown] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [producerSearch, setProducerSearch] = useState('');
  const [executorSearch, setExecutorSearch] = useState('');
  const [models, setModels] = useState<Model[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [addresses, setAddresses] = useState<Array<{id: string, address: string, room: string}>>([]);
  const [loading, setLoading] = useState(false);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      if (!isOpen) return;
      
      setLoading(true);
      try {
        const [modelsData, usersData, addressesData] = await Promise.all([
          modelsAPI.getAll(),
          usersAPI.getAll(),
          addressesAPI.getAll()
        ]);
        
        
        setModels(modelsData.map((model: any) => ({
          ...model,
          accounts: model.accounts || []
        })));
        setEmployees(usersData.map((user: any) => ({
          id: user.id,
          name: user.fullName,
          role: user.role
        })));
        
        console.log('Loaded addresses:', addressesData);
        setAddresses(addressesData.items || addressesData || []);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen]);

  useEffect(() => {
    if (shift && mode !== 'create') {
      console.log('Loading shift data:', shift);
      
      // Map shift data to form fields
      const mappedFormData = {
        modelName: shift.model || shift.modelName || '',
        producer: shift.responsible || shift.producer || '',
        executor: shift.executor || '',
        address: shift.address || '',
        room: shift.room || '',
        startDateTime: shift.start || shift.startDateTime || '',
        endDateTime: shift.end || shift.endDateTime || '',
        type: shift.type || 'regular',
        status: shift.status || 'pending',
        comment: shift.comment || ''
      };
      
      console.log('Mapped form data:', mappedFormData);
      
      setFormData(mappedFormData);
      setModelSearch(mappedFormData.modelName);
      setProducerSearch(mappedFormData.producer);
      setExecutorSearch(mappedFormData.executor);
      
      // Load model accounts
      const model = models.find((m: any) => m.name === mappedFormData.modelName);
      if (model) {
        setModelAccounts(model.accounts || []);
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
        status: 'pending',
        comment: ''
      });
      setModelAccounts([]);
      setModelSearch('');
      setProducerSearch('');
      setExecutorSearch('');
    }
  }, [shift, mode, isOpen, models]);

  const handleInputChange = (field: keyof Shift, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear selections when shift type changes
    if (field === 'type') {
      setModelSearch('');
      setProducerSearch('');
      setFormData(prev => ({ 
        ...prev, 
        [field]: value,
        modelName: '',
        producer: ''
      }));
      setModelAccounts([]);
    }
  };

  const handleModelSelect = (modelName: string) => {
    setModelSearch(modelName);
    setFormData(prev => ({ ...prev, modelName }));
    setShowModelDropdown(false);
    
    // Load model accounts
    const model = models.find((m: any) => m.name === modelName);
    if (model) {
      setModelAccounts(model.accounts || []);
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

  const handleAddressChange = (addressId: string) => {
    console.log('Address change:', addressId, addresses);
    const selectedAddress = addresses.find(addr => addr.id.toString() === addressId);
    console.log('Selected address:', selectedAddress);
    if (selectedAddress) {
      setFormData(prev => ({ 
        ...prev, 
        address: selectedAddress.address,
        room: selectedAddress.room 
      }));
    } else if (addressId === "") {
      setFormData(prev => ({ 
        ...prev, 
        address: "",
        room: "" 
      }));
    }
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
      model: formData.modelName, // Map modelName to model field
      responsible: formData.producer, // Map producer to responsible field
      date: formData.startDateTime?.split('T')[0] || '', // Extract date
      time: formData.startDateTime?.split('T')[1] || '', // Extract time
      start: formData.startDateTime,
      end: formData.endDateTime,
      status: 'pending', // Set valid status instead of 'upcoming'
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
    return models.filter((model: any) => {
      const nameMatch = model.name.toLowerCase().includes(modelSearch.toLowerCase());
      const shiftType = formData.type || 'regular';
      
      // Convert status to ModelStatus enum if needed
      let modelStatus = model.status;
      if (typeof modelStatus === 'string') {
        // Try to match string status to enum
        const statusKey = Object.keys(ModelStatus).find(key => 
          ModelStatus[key as keyof typeof ModelStatus] === modelStatus ||
          key.toLowerCase() === modelStatus.toLowerCase()
        );
        if (statusKey) {
          modelStatus = ModelStatus[statusKey as keyof typeof ModelStatus];
        }
      }
      
      const validation = StatusManager.canCreateShift(modelStatus, shiftType);
      return nameMatch && validation.allowed;
    });
  };

  // Filter employees based on shift type
  const getAvailableProducers = () => {
    if (formData.type === 'training') {
      // For training shifts: only curators
      return employees.filter((emp: any) => 
        emp.role === 'curator' &&
        emp.name.toLowerCase().includes(producerSearch.toLowerCase())
      );
    } else {
      // For regular shifts: only producers
      return employees.filter((emp: any) => 
        emp.role === 'producer' &&
        emp.name.toLowerCase().includes(producerSearch.toLowerCase())
      );
    }
  };

  const getAvailableOperators = () => {
    return employees.filter((emp: any) => 
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
                      // Clear selection if search doesn't match
                      if (formData.modelName && !formData.modelName.toLowerCase().includes(e.target.value.toLowerCase())) {
                        setFormData(prev => ({ ...prev, modelName: '' }));
                        setModelAccounts([]);
                      }
                    }}
                    onFocus={() => setShowModelDropdown(true)}
                    onBlur={() => setTimeout(() => setShowModelDropdown(false), 150)}
                    placeholder="Поиск модели..."
                    className="form-input"
                  />
                  {showModelDropdown && (
                    <div className="dropdown-options active">
                      {loading ? (
                        <div className="option disabled">Загрузка...</div>
                      ) : getAvailableModels().length > 0 ? (
                        getAvailableModels().map((model: any) => (
                          <div
                            key={model.id}
                            className="option"
                            onClick={() => handleModelSelect(model.name)}
                          >
                            <div className="option-name">{model.name}</div>
                            <div className="option-status">{StatusManager.getStatusLabel(model.status)}</div>
                          </div>
                        ))
                      ) : (
                        <div className="option disabled">
                          {modelSearch ? 'Модели не найдены' : 'Нет доступных моделей для данного типа смены'}
                        </div>
                      )}
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
                        {loading ? (
                          <div className="option disabled">Загрузка...</div>
                        ) : getAvailableOperators().length > 0 ? (
                          getAvailableOperators().map((operator: any) => (
                            <div
                              key={operator.id}
                              className="option"
                              onClick={() => handleExecutorSelect(operator.name)}
                            >
                              {operator.name}
                            </div>
                          ))
                        ) : (
                          <div className="option disabled">
                            Нет доступных операторов
                          </div>
                        )}
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
                      {loading ? (
                        <div className="option disabled">Загрузка...</div>
                      ) : getAvailableProducers().length > 0 ? (
                        getAvailableProducers().map((employee: any) => (
                          <div
                            key={employee.id}
                            className="option"
                            onClick={() => handleProducerSelect(employee.name)}
                          >
                            {employee.name}
                          </div>
                        ))
                      ) : (
                        <div className="option disabled">
                          {formData.type === 'training' ? 'Нет доступных кураторов' : 'Нет доступных продюсеров'}
                        </div>
                      )}
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
                  value={addresses.find(addr => addr.address === formData.address && addr.room === formData.room)?.id?.toString() || ""}
                  onChange={(e) => handleAddressChange(e.target.value)}
                >
                  <option value="">Выберите квартиру</option>
                  {addresses.map((addr) => (
                    <option key={addr.id} value={addr.id.toString()}>
                      {addr.address}, {addr.room}
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
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.room} 
                  readOnly 
                  placeholder="Комната будет выбрана автоматически"
                />
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
            {mode !== 'view' && (
              <div className="modal-actions">
                <button type="button" className="btn btn-cancel" onClick={onClose}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  {mode === 'create' ? 'Создать смену' : 'Сохранить изменения'}
                </button>
              </div>
            )}
          </form>
        </div>

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
