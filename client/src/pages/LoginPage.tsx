import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import RegisterModal from '../components/RegisterModal';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      console.log('Attempting login with:', credentials.username);
      await login(credentials.username, credentials.password);
      console.log('Login successful');
      toast.success('Успешный вход');
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      // Handle different error types
      if (error.message?.includes('inactive')) {
        toast.error('Аккаунт неактивен. Обратитесь к администратору.');
      } else if (error.message?.includes('Invalid credentials')) {
        toast.error('Неверные учетные данные');
      } else {
        toast.error(error.message || 'Ошибка входа');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (userData: any) => {
    try {
      console.log('Registering user:', userData);
      const response = await authAPI.register(userData);
      
      if (response.success) {
        toast.success(`Пользователь ${userData.fullName} зарегистрирован!`);
        toast.success(`Логин: ${userData.username}, Пароль: ${userData.password}`);
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      toast.error(`Ошибка регистрации: ${error.message}`);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card card">
        <h1 className="login-title">Mirror CRM</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Имя пользователя</label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              placeholder="root"
              autoComplete="username"
              required
            />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              placeholder="Введите пароль"
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        
        <div className="register-link">
          <p>Нет аккаунта?</p>
          <button 
            type="button" 
            className="btn-link"
            onClick={() => setIsRegisterModalOpen(true)}
          >
            Зарегистрироваться
          </button>
        </div>
      </div>

      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onRegister={handleRegister}
      />
    </div>
  );
}
