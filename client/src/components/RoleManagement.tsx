import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import '../styles/role-management.scss';

interface Role {
  id: string;
  name: string;
  displayName: string;
  permissions: string[];
  modules: Record<string, any>;
}

interface Module {
  name: string;
  displayName: string;
  permissions: string[];
}

const MODULES: Module[] = [
  {
    name: 'models',
    displayName: 'Модели',
    permissions: ['view', 'create', 'edit', 'delete', 'export']
  },
  {
    name: 'slots',
    displayName: 'Слоты',
    permissions: ['view', 'create', 'edit', 'delete', 'manage']
  },
  {
    name: 'shifts',
    displayName: 'Смены',
    permissions: ['view', 'create', 'edit', 'delete', 'manage']
  },
  {
    name: 'analytics',
    displayName: 'Аналитика',
    permissions: ['view', 'edit', 'export']
  },
  {
    name: 'users',
    displayName: 'Пользователи',
    permissions: ['view', 'create', 'edit', 'delete', 'manage_roles']
  },
  {
    name: 'audit',
    displayName: 'Аудит',
    permissions: ['view', 'export']
  },
  {
    name: 'settings',
    displayName: 'Настройки',
    permissions: ['view', 'edit']
  },
  {
    name: 'addresses',
    displayName: 'Адреса',
    permissions: ['view', 'create', 'edit', 'delete']
  }
];

const PERMISSION_LABELS: Record<string, string> = {
  view: 'Просмотр',
  create: 'Создание',
  edit: 'Редактирование',
  delete: 'Удаление',
  export: 'Экспорт',
  manage: 'Управление',
  manage_roles: 'Управление ролями'
};

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE || '/api';

const RoleManagement: React.FC = () => {
  const { user } = useAuthStore();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Проверяем, что пользователь root
  const isRoot = user?.username === 'root';

  useEffect(() => {
    if (isRoot) {
      loadRoles();
    }
  }, [isRoot]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const rolesData = await response.json();
        setRoles(rolesData);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRolePermissions = async (roleId: string, module: string, permission: string, enabled: boolean) => {
    try {
      setSaving(true);
      const role = roles.find(r => r.id === roleId);
      if (!role) return;

      const updatedModules = { ...role.modules };
      if (!updatedModules[module]) {
        updatedModules[module] = {};
      }
      updatedModules[module][permission] = enabled;

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/roles/${roleId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          modules: updatedModules
        })
      });

      if (response.ok) {
        setRoles(prev => prev.map(r => 
          r.id === roleId 
            ? { ...r, modules: updatedModules }
            : r
        ));
      }
    } catch (error) {
      console.error('Error updating role permissions:', error);
    } finally {
      setSaving(false);
    }
  };

  const hasPermission = (role: Role, module: string, permission: string): boolean => {
    return role.modules?.[module]?.[permission] || false;
  };

  if (!isRoot) {
    return (
      <div className="page-container">
        <div className="access-denied">
          <h2>Доступ запрещен</h2>
          <p>Только пользователь root может управлять ролями и правами доступа.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner">Загрузка ролей...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="role-management">
        <div className="container">
          <div className="page-header">
            <h1>Управление ролями и правами доступа</h1>
            <p>Настройка прав доступа к модулям системы для каждой роли</p>
          </div>

          <div className="permissions-table-container">
            <table className="permissions-table">
              <thead>
                <tr>
                  <th className="module-header">Модуль</th>
                  {roles.map(role => (
                    <th key={role.id} className="role-header">
                      <div className="role-info">
                        <div className="role-name">{role.displayName}</div>
                        <div className="role-code">({role.name})</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULES.map(module => (
                  <React.Fragment key={module.name}>
                    <tr className="module-row">
                      <td className="module-name" colSpan={roles.length + 1}>
                        {module.displayName}
                      </td>
                    </tr>
                    {module.permissions.map(permission => (
                      <tr key={`${module.name}-${permission}`} className="permission-row">
                        <td className="permission-name">
                          {PERMISSION_LABELS[permission] || permission}
                        </td>
                        {roles.map(role => (
                          <td key={role.id} className="permission-cell">
                            <label className="permission-checkbox">
                              <input
                                type="checkbox"
                                checked={hasPermission(role, module.name, permission)}
                                onChange={(e) => updateRolePermissions(
                                  role.id, 
                                  module.name, 
                                  permission, 
                                  e.target.checked
                                )}
                                disabled={saving}
                              />
                              <span className="checkmark"></span>
                            </label>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {saving && (
            <div className="saving-indicator">
              <div className="saving-spinner"></div>
              <span>Сохранение изменений...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;
