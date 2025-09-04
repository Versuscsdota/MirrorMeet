import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';

interface Employee {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  role: string;
  status: 'active' | 'inactive';
  firstInternshipDate?: string;
}

interface EditEmployeeModalProps {
  isOpen: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSave: (employeeData: Partial<Employee>) => void;
}

const ROLES = [
  { value: 'admin', label: 'Администратор' },
  { value: 'producer', label: 'Продьюсер' },
  { value: 'curator', label: 'Куратор' },
  { value: 'interviewer', label: 'Интервьюер' },
  { value: 'operator', label: 'Оператор' },
  { value: 'inactive', label: 'Неактивный' }
];

const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  isOpen,
  employee,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    role: 'employee',
    status: 'inactive' as 'active' | 'inactive',
    firstInternshipDate: '',
    password: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user } = useAuthStore();
  const isRoot = user?.username === 'root';

  useEffect(() => {
    if (employee) {
      setFormData({
        fullName: employee.fullName || '',
        username: employee.username || '',
        email: employee.email || '',
        phone: employee.phone || '',
        role: employee.role || 'employee',
        status: employee.status || 'inactive',
        firstInternshipDate: employee.firstInternshipDate || '',
        password: ''
      });
    }
  }, [employee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    setIsLoading(true);
    try {
      await onSave({
        id: employee.id,
        ...formData
      });
      onClose();
    } catch (error) {
      console.error('Error updating employee:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen || !employee) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Редактировать сотрудника</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fullName">Полное имя</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="username">Имя пользователя</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Телефон</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="role">Роль</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                {ROLES.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status">Статус</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="active">Активный</option>
                <option value="inactive">Неактивный</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="firstInternshipDate">Дата первой стажировки</label>
            <input
              type="date"
              id="firstInternshipDate"
              name="firstInternshipDate"
              value={formData.firstInternshipDate}
              onChange={handleChange}
            />
          </div>

          {isRoot && (
            <div className="form-group">
              <label htmlFor="password">Новый пароль (только для root)</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Оставьте пустым, чтобы не менять"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️‍🗨️' : '👁️'}
                </button>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEmployeeModal;
