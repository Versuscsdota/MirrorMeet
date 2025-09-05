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
    <div className="modal">
      <div className="modal-content register-modal">
        <div className="modal-header">
          <h2>Регистрация</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>ФИО *</label>
            <input
              type="text"
              name="fullName"
              placeholder="Введите полное имя"
              autoComplete="name"
              value={formData.fullName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Телефон *</label>
            <input
              type="tel"
              name="phone"
              placeholder="+7 (999) 123-45-67"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Дата первой стажировки</label>
            <input
              type="date"
              name="firstInternshipDate"
              value={formData.firstInternshipDate}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>Логин *</label>
            <input
              type="text"
              name="username"
              placeholder="Автоматически генерируется"
              autoComplete="username"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Пароль *</label>
            <div className="password-grid">
              <input
                type="text"
                name="password"
                placeholder="Нажмите 'Генерировать' для создания пароля"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleGeneratePassword}
              >
                🎲
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Фото профиля</label>
            <div className="photo-picker-wrap">
              <input
                type="file"
                id="photo"
                name="photo"
                accept="image/*"
                onChange={handlePhotoChange}
                className="photo-input-hidden"
              />
              <label htmlFor="photo" className="photo-picker">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="photo-preview" />
                ) : (
                  <div className="photo-placeholder">
                    <span>📷</span>
                    <span>Загрузить фото</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary">
              Зарегистрировать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterModal;
