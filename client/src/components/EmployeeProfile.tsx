import React, { useState, useEffect } from 'react';
import { User } from '../types';
import ShiftHistory from './ShiftHistory';

interface EmployeeProfileProps {
  employee: User;
  onClose: () => void;
  onEdit?: () => void;
}

const EmployeeProfile: React.FC<EmployeeProfileProps> = ({ 
  employee, 
  onClose, 
  onEdit 
}) => {
  const [employeeData, setEmployeeData] = useState(employee);

  useEffect(() => {
    setEmployeeData(employee);
  }, [employee]);

  const getRoleLabel = (role: string) => {
    const roleLabels: { [key: string]: string } = {
      'curator': 'Куратор',
      'producer': 'Продюсер',
      'operator': 'Оператор',
      'admin': 'Администратор',
      'root': 'Суперадминистратор'
    };
    return roleLabels[role] || role;
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: { [key: string]: string } = {
      'active': 'Активен',
      'inactive': 'Неактивен',
      'suspended': 'Заблокирован'
    };
    return statusLabels[status] || status;
  };

  const getStatusClass = (status: string) => {
    const statusClasses: { [key: string]: string } = {
      'active': 'status-active',
      'inactive': 'status-inactive',
      'suspended': 'status-suspended'
    };
    return statusClasses[status] || 'status-unknown';
  };

  return (
    <div className="employee-profile-overlay">
      <div className="employee-profile-modal">
        <div className="employee-profile-header">
          <div className="employee-info">
            <div className="employee-avatar">
              {employeeData.avatar ? (
                <img src={employeeData.avatar} alt={employeeData.fullName || employeeData.username} />
              ) : (
                <div className="avatar-placeholder">
                  <i className="material-icons">person</i>
                </div>
              )}
            </div>
            <div className="employee-details">
              <h2>{employeeData.fullName || employeeData.username}</h2>
              <div className="employee-meta">
                <span className="role">{getRoleLabel(typeof employeeData.role === 'string' ? employeeData.role : employeeData.role.name)}</span>
                <span className={`status ${getStatusClass(employeeData.status || 'active')}`}>
                  {getStatusLabel(employeeData.status || 'active')}
                </span>
              </div>
            </div>
          </div>
          <div className="profile-actions">
            {onEdit && (
              <button className="btn btn-secondary" onClick={onEdit}>
                <i className="material-icons">edit</i>
                Редактировать
              </button>
            )}
            <button className="btn btn-secondary" onClick={onClose}>
              <i className="material-icons">close</i>
              Закрыть
            </button>
          </div>
        </div>

        <div className="employee-profile-content">
          <div className="profile-section">
            <h3>Основная информация</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Логин:</label>
                <span>{employeeData.username}</span>
              </div>
              {employeeData.email && (
                <div className="info-item">
                  <label>Email:</label>
                  <span>{employeeData.email}</span>
                </div>
              )}
              {employeeData.phone && (
                <div className="info-item">
                  <label>Телефон:</label>
                  <span>{employeeData.phone}</span>
                </div>
              )}
              {employeeData.firstInternshipDate && (
                <div className="info-item">
                  <label>Дата начала стажировки:</label>
                  <span>{new Date(employeeData.firstInternshipDate).toLocaleDateString('ru-RU')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="profile-section">
            <ShiftHistory 
              employeeId={employeeData.id} 
              title="История смен сотрудника"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
