import React, { useState } from 'react';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employeeData: any) => void;
}

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    firstInternshipDate: '',
    photo: null as File | null,
    role: 'Пользователь',
    userId: ''
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate userId from fullName
    const userId = formData.fullName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    const employeeData = {
      ...formData,
      userId,
      id: Date.now(), // Temporary ID generation
      username: `@${userId}`,
      email: `${userId}@example.com`, // Auto-generate email
      status: 'active' as const,
      avatar: photoPreview || '👤'
    };

    onSave(employeeData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      fullName: '',
      phone: '',
      firstInternshipDate: '',
      photo: null,
      role: 'Пользователь',
      userId: ''
    });
    setPhotoPreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal add-employee-modal">
        <div className="modal-header">
          <h2 className="modal-title">Добавить сотрудника</h2>
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
            <label className="form-label">Роль *</label>
            <select
              name="role"
              className="form-select"
              value={formData.role}
              onChange={handleInputChange}
              required
            >
              <option value="Пользователь">Пользователь</option>
              <option value="Рекрутер">Рекрутер</option>
              <option value="Администратор">Администратор</option>
            </select>
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
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;
