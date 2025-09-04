import React, { useState, useEffect } from 'react';
import AddEmployeeModal from './AddEmployeeModal';
import EditEmployeeModal from './EditEmployeeModal';

interface Employee {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  avatar: string;
  phone?: string;
  firstInternshipDate?: string;
  createdAt: string;
  updatedAt?: string;
}

const API_BASE_URL = 'http://localhost:3001/api';

const fetchUsers = async (): Promise<Employee[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    const users = await response.json();
    return users.map((user: any) => ({
      ...user,
      fullName: user.fullName || user.username,
      status: user.status || 'inactive'
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

const createUser = async (userData: any): Promise<Employee | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create user');
    }
    
    const newUser = await response.json();
    return {
      ...newUser,
      fullName: newUser.fullName || newUser.username,
      status: newUser.status || 'inactive'
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
};

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    const users = await fetchUsers();
    setEmployees(users);
    setLoading(false);
  };

  const filteredEmployees = employees.filter(employee =>
    employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStatus = async (id: string) => {
    try {
      const employee = employees.find(emp => emp.id === id);
      if (!employee) return;
      
      const newStatus = employee.status === 'active' ? 'inactive' : 'active';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/users/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        setEmployees(prev => prev.map(emp => 
          emp.id === id 
            ? { ...emp, status: newStatus }
            : emp
        ));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const updateEmployee = async (employeeData: Partial<Employee>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users/${employeeData.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(employeeData)
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setEmployees(prev => prev.map(emp => 
          emp.id === employeeData.id 
            ? { ...emp, ...updatedUser }
            : emp
        ));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating employee:', error);
      return false;
    }
  };

  const handleAction = (action: string, employee: Employee) => {
    console.log('handleAction called with:', action, employee);
    console.log('Current isEditModalOpen:', isEditModalOpen);
    if (action === 'edit' || action === 'menu') {
      setSelectedEmployee(employee);
      setIsEditModalOpen(true);
      console.log('Set isEditModalOpen to true');
    }
  };

  const handleEditEmployee = async (employeeData: Partial<Employee>) => {
    const success = await updateEmployee(employeeData);
    if (success) {
      setIsEditModalOpen(false);
      setSelectedEmployee(null);
    }
  };

  const handleAddEmployee = async (employeeData: any) => {
    const newUser = await createUser(employeeData);
    if (newUser) {
      setEmployees(prev => [...prev, newUser]);
      console.log('New employee added:', newUser);
    }
  };

  return (
    <div className="page-container">
      <div className="employees-page">
        <div className="container">
          <div className="employees-header">
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Поиск сотрудников..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>
            
            <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
              + Добавить сотрудника
            </button>
          </div>

          <div className="employees-table-container">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner">Загрузка...</div>
              </div>
            ) : (
              <table className="employees-table">
                <thead>
                  <tr>
                    <th>Имя пользователя</th>
                    <th>Email</th>
                    <th>Роль</th>
                    <th>Статус</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="no-employees">
                        {searchTerm ? 'Сотрудники не найдены' : 'Нет зарегистрированных сотрудников'}
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <tr key={employee.id}>
                        <td>
                          <div className="employee-info">
                            <div className="employee-avatar">
                              {employee.avatar || '👤'}
                            </div>
                            <div className="employee-details">
                              <div className="employee-name">{employee.fullName}</div>
                              <div className="employee-username">@{employee.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="employee-email">{employee.email}</td>
                        <td className="employee-role">{employee.role}</td>
                        <td>
                          <button
                            className={`status-badge ${employee.status}`}
                            onClick={() => toggleStatus(employee.id)}
                          >
                            {employee.status === 'active' ? 'Активен' : 'Неактивен'}
                          </button>
                        </td>
                        <td>
                          <div className="employee-actions">
                            <button 
                              className="action-btn employee-action-btn"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Button clicked, employee:', employee);
                                handleAction('menu', employee);
                              }}
                              onMouseDown={() => {
                                console.log('Mouse down on button');
                              }}
                            >
                              ⋯
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddEmployee}
      />

      <EditEmployeeModal
        isOpen={isEditModalOpen}
        employee={selectedEmployee}
        onClose={() => {
          console.log('EditEmployeeModal onClose called');
          setIsEditModalOpen(false);
          setSelectedEmployee(null);
        }}
        onSave={handleEditEmployee}
      />
    </div>
  );
};

export default Employees;
