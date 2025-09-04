import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { address: string; room: string; comment?: string }) => void;
  initialData?: { address: string; room: string; comment?: string };
}

const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [formData, setFormData] = useState({
    address: initialData?.address || '',
    room: initialData?.room || '',
    comment: initialData?.comment || ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.address.trim() || !formData.room.trim()) {
      toast.error('Заполните все поля');
      return;
    }

    onSave(formData);
    setFormData({ address: '', room: '', comment: '' });
    onClose();
    toast.success('Квартира добавлена');
  };

  const handleClose = () => {
    setFormData({ address: '', room: '', comment: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active">
      <div className="modal address-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {initialData ? 'Редактировать квартиру' : 'Добавить квартиру'}
          </h2>
          <button className="modal-close" onClick={handleClose}>&times;</button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Адрес *</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Введите адрес..."
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Количество комнат *</label>
              <input
                type="number"
                value={formData.room}
                onChange={(e) => handleInputChange('room', e.target.value)}
                placeholder="Введите количество комнат..."
                className="form-input"
                min="1"
                max="10"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Комментарий</label>
              <textarea
                value={formData.comment}
                onChange={(e) => handleInputChange('comment', e.target.value)}
                placeholder="Дополнительная информация о квартире..."
                className="form-input"
                rows={3}
              />
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={handleClose}>
            Отмена
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>
            {initialData ? 'Сохранить' : 'Добавить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressModal;
