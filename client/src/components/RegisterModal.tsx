import React, { useState } from 'react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (userData: any) => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onRegister }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    firstInternshipDate: '',
    photo: null as File | null,
    username: '',
    password: ''
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const generateUsername = (fullName: string) => {
    return fullName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-generate username when fullName changes
      if (name === 'fullName') {
        updated.username = generateUsername(value);
      }
      
      return updated;
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        photo: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setFormData(prev => ({
      ...prev,
      password: newPassword
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const userData = {
      ...formData,
      email: formData.username ? `${formData.username}@mirrorcrm.com` : '',
      role: 'inactive',
      status: 'inactive' as const,
      avatar: photoPreview || '👤'
    };

    onRegister(userData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      fullName: '',
      phone: '',
      firstInternshipDate: '',
      photo: null,
      username: '',
      password: ''
    });
    setPhotoPreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal register-modal">
        <div className="modal-header">
          <h2 className="modal-title">Регистрация</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="form-label">ФИО *</label>
            <input
              type="text"
              name="fullName"
              className="form-input"
              placeholder="Введите полное имя"
              autoComplete="name"
              value={formData.fullName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Телефон *</label>
            <input
              type="tel"
              name="phone"
              className="form-input"
              placeholder="+7 (999) 123-45-67"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Дата первой стажировки</label>
            <input
              type="date"
              name="firstInternshipDate"
              className="form-input"
              value={formData.firstInternshipDate}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Логин *</label>
            <input
              type="text"
              name="username"
              className="form-input"
              placeholder="Автоматически генерируется"
              autoComplete="username"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Пароль *</label>
            <div className="password-group">
              <input
                type="text"
                name="password"
                className="form-input"
                placeholder="Нажмите 'Генерировать' для создания пароля"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <button 
                type="button" 
                className="btn-generate-password"
                onClick={handleGeneratePassword}
              >
                🎲
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Фото профиля</label>
            <div className="photo-upload">
              <input
                type="file"
                id="photo"
                name="photo"
                accept="image/*"
                onChange={handlePhotoChange}
                className="photo-input"
              />
              <label htmlFor="photo" className="photo-upload-label">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="photo-preview" />
                ) : (
                  <div className="photo-placeholder">
                    <span className="photo-icon">📷</span>
                    <span className="photo-text">Загрузить фото</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              Отмена
            </button>
            <button type="submit" className="btn-primary">
              Зарегистрировать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterModal;
