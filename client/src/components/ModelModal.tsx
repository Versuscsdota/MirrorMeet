import { useState, useEffect } from 'react';
import { Model, DocumentType, DocumentTypeLabels } from '../types';

interface ModelModalProps {
  model: Model | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Model>) => void;
}

export default function ModelModal({ model, isOpen, onClose, onSave }: ModelModalProps) {
  const [formData, setFormData] = useState<Partial<Model>>({
    name: '',
    phone: '',
    telegram: '',
    birthDate: '',
    firstTrialDate: '',
    documentType: DocumentType.NOT_SPECIFIED,
    documentNumber: ''
  });

  const formatPhone = (raw: string) => {
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
    if (!digits.startsWith('7')) digits = '7' + digits;
    digits = digits.slice(0, 11);
    const p1 = digits.slice(1, 4);
    const p2 = digits.slice(4, 7);
    const p3 = digits.slice(7, 9);
    const p4 = digits.slice(9, 11);
    let result = '+7';
    if (p1) result += ` (${p1}`;
    if (p1 && p1.length === 3) result += ')';
    if (p2) result += ` ${p2}`;
    if (p3) result += `-${p3}`;
    if (p4) result += `-${p4}`;
    return result;
  };

  useEffect(() => {
    if (model) {
      setFormData({
        ...model,
        birthDate: model.birthDate || '',
        firstTrialDate: model.firstTrialDate || '',
        documentType: model.documentType || DocumentType.NOT_SPECIFIED,
        documentNumber: model.documentNumber || ''
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        telegram: '',
        birthDate: '',
        firstTrialDate: '',
        documentType: DocumentType.NOT_SPECIFIED,
        documentNumber: ''
      });
    }
  }, [model]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };


  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{model ? 'Редактировать модель' : 'Новая модель'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>ФИО *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              autoComplete="name"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Телефон</label>
            <input
              type="tel"
              value={formData.phone || ''}
              inputMode="tel"
              maxLength={18}
              placeholder={"+7 (999) 123-45-67"}
              onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
              autoComplete="tel"
            />
          </div>
          
          
          <div className="form-group">
            <label>Telegram</label>
            <input
              type="text"
              value={formData.telegram || ''}
              onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
              placeholder="@username"
            />
          </div>
          

          <div className="form-row">
            <div className="form-group">
              <label>Дата рождения</label>
              <input
                type="date"
                value={formData.birthDate || ''}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Дата первой стажировки</label>
              <input
                type="date"
                value={formData.firstTrialDate || ''}
                onChange={(e) => setFormData({ ...formData, firstTrialDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Тип документа</label>
              <select
                value={formData.documentType || DocumentType.NOT_SPECIFIED}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value as DocumentType })}
              >
                {Object.values(DocumentType).map((dt) => (
                  <option key={dt} value={dt}>{DocumentTypeLabels[dt]}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Серия и номер / Номер</label>
              <input
                type="text"
                value={formData.documentNumber || ''}
                onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                placeholder="0000 000000 или номер"
              />
            </div>
          </div>
          
          
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Отмена
            </button>
            <button type="submit" className="btn btn-primary">
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
