import { useState, useEffect } from 'react';
import { Model, ModelStatus, Slot, DocumentType } from '../types';
import { modelsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { validateRequired, validatePhone, validateBirthDate, validateTrialDate, validateFile } from '../utils/validation';

interface SlotModalProps {
  slot: Slot | null;
  slots: Slot[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Slot>) => Promise<void>;
}

export default function SlotModal({ slot, slots, isOpen, onClose, onSave }: SlotModalProps) {
  const [formData, setFormData] = useState<Partial<Slot>>({
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    status: ModelStatus.NOT_CONFIRMED,
    notes: '',
    modelId: undefined,
    comments: []
  });
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [status1, setStatus1] = useState('not_confirmed'); // Не подтвердилась/Подтвердилась/Слив
  const [status2, setStatus2] = useState(''); // Отказ кандидата/Отказ с нашей стороны/Думает - необязательно
  const [visitStatus, setVisitStatus] = useState('not_arrived'); // Пришла/Не пришла/Другое
  const [showComment, setShowComment] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationStarted, setRegistrationStarted] = useState(false);
  const [comment, setComment] = useState('');
  const [registrationComment, setRegistrationComment] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [documentDetails, setDocumentDetails] = useState('');
  const [internshipDate, setInternshipDate] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (slot) {
      setFormData(slot);
      setClientName(slot.clientName || '');
      setClientPhone(slot.clientPhone || '');
      setComment(slot.notes || '');
      
      // Load status buttons from slot data
      if (slot.status1) setStatus1(slot.status1);
      if (slot.status2) setStatus2(slot.status2);
      
      // Load visit status if available
      if (slot.visitStatus) setVisitStatus(slot.visitStatus);
      
      // Clear errors when loading existing slot
      setErrors({});
    } else {
      // Reset form for new slot
      setFormData({
        date: new Date().toISOString().split('T')[0],
        time: '12:00',
        status: ModelStatus.NOT_CONFIRMED,
        notes: '',
        modelId: undefined,
        comments: []
      });
      setClientName('');
      setClientPhone('');
      setComment('');
      setStatus1('');
      setStatus2('');
      setVisitStatus('');
      setErrors({});
    }
  }, [slot]);

  // Handle visit status changes
  useEffect(() => {
    setShowComment(visitStatus === 'other');
  }, [visitStatus]);

  // Registration button is always available
  useEffect(() => {
    setShowRegistration(true);
  }, []);

  // Generate available time slots (12:00 - 18:30, 30min intervals)
  const availableTimes = (() => {
    const times: string[] = [];
    const start = 12 * 60; // 12:00
    const end = 18 * 60 + 30; // 18:30
    for (let m = start; m <= end; m += 30) {
      const hh = Math.floor(m / 60).toString().padStart(2, '0');
      const mm = (m % 60).toString().padStart(2, '0');
      times.push(`${hh}:${mm}`);
    }
    return times;
  })();

  // Check how many slots exist for a given date/time
  const getSlotsCount = (date: string, time: string) => {
    return slots.filter(s => s.date === date && s.time === time && s.id !== slot?.id).length;
  };


  const handleStartRegistration = () => {
    setRegistrationStarted(true);
  };


  const validateRegistrationForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate birth date
    const birthDateValidation = validateBirthDate(birthDate);
    if (!birthDateValidation.isValid) {
      newErrors.birthDate = birthDateValidation.error!;
    }

    // Validate document type
    const docTypeValidation = validateRequired(documentType, 'Тип документа');
    if (!docTypeValidation.isValid) {
      newErrors.documentType = docTypeValidation.error!;
    }

    // Validate document details
    const docDetailsValidation = validateRequired(documentDetails, 'Данные документа');
    if (!docDetailsValidation.isValid) {
      newErrors.documentDetails = docDetailsValidation.error!;
    }

    // Validate trial date
    const trialDateValidation = validateTrialDate(internshipDate);
    if (!trialDateValidation.isValid) {
      newErrors.internshipDate = trialDateValidation.error!;
    }

    // Validate files
    const photoValidation = validateFile(photoFile, 'Фото', true);
    if (!photoValidation.isValid) {
      newErrors.photoFile = photoValidation.error!;
    }

    const audioValidation = validateFile(audioFile, 'Аудио', true);
    if (!audioValidation.isValid) {
      newErrors.audioFile = audioValidation.error!;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateRegistrationForm()) {
      toast.error('Пожалуйста, исправьте ошибки в форме');
      return;
    }

    try {
      // Map status buttons to ModelStatus for the new model
      let modelStatus = ModelStatus.REGISTERED;
      if (status1 === 'confirmed') modelStatus = ModelStatus.CONFIRMED;
      else if (status1 === 'drained') modelStatus = ModelStatus.DRAINED;
      else if (status2 === 'candidate_refused') modelStatus = ModelStatus.CANDIDATE_REFUSED;
      else if (status2 === 'our_refusal') modelStatus = ModelStatus.OUR_REFUSAL;
      else if (status2 === 'thinking') modelStatus = ModelStatus.THINKING;

      // Create new model with all data including statuses and comments
      const modelComments = [...(formData.comments || [])];
      if (registrationComment.trim()) {
        modelComments.push({
          text: registrationComment.trim(),
          timestamp: new Date().toISOString()
        });
      }

      const newModel: Partial<Model> = {
        name: clientName,
        phone: clientPhone,
        birthDate,
        documentType: documentType as DocumentType,
        documentNumber: documentDetails,
        firstTrialDate: internshipDate,
        status: modelStatus,
        comments: modelComments
      };

      const createdModel = await modelsAPI.create(newModel as any);
      
      // Upload files to the new model
      if (photoFile || audioFile) {
        const files = [photoFile, audioFile].filter(Boolean) as File[];
        await modelsAPI.uploadFiles(createdModel.id, files);
      }

      // Update slot to link to new model and preserve the actual status
      await onSave({
        ...formData,
        modelId: createdModel.id,
        status: modelStatus,
        notes: comment || formData.notes
      });

      toast.success('Регистрация успешно завершена!');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Ошибка при регистрации');
    }
  };

  const validateSlotForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate client name if provided
    if (clientName.trim()) {
      const nameValidation = validateRequired(clientName, 'ФИО клиента');
      if (!nameValidation.isValid) {
        newErrors.clientName = nameValidation.error!;
      }
    }

    // Validate client phone if provided
    if (clientPhone.trim()) {
      const phoneValidation = validatePhone(clientPhone);
      if (!phoneValidation.isValid) {
        newErrors.clientPhone = phoneValidation.error!;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSlotForm()) {
      toast.error('Пожалуйста, исправьте ошибки в форме');
      return;
    }
    
    if (visitStatus === 'other' && !comment.trim()) {
      toast.error('Пожалуйста, укажите комментарий при выборе статуса "Другое"');
      return;
    }
    
    try {
      // Map status buttons to ModelStatus
      let finalStatus = ModelStatus.NOT_CONFIRMED;
      if (status1 === 'confirmed') finalStatus = ModelStatus.CONFIRMED;
      else if (status1 === 'drained') finalStatus = ModelStatus.DRAINED;
      else if (status2 === 'candidate_refused') finalStatus = ModelStatus.CANDIDATE_REFUSED;
      else if (status2 === 'our_refusal') finalStatus = ModelStatus.OUR_REFUSAL;
      else if (status2 === 'thinking') finalStatus = ModelStatus.THINKING;
      
      await onSave({
        ...formData,
        clientName,
        clientPhone,
        status: finalStatus,
        notes: comment || formData.notes
      });
      
      toast.success('Слот успешно сохранен');
      onClose();
    } catch (error) {
      console.error('Error saving slot:', error);
      toast.error('Ошибка при сохранении слота');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{slot ? 'Редактировать слот' : 'Новый слот'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>ФИО</label>
            <input
              type="text"
              placeholder="Иванов Иван Иванович"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className={errors.clientName ? 'error' : ''}
            />
            {errors.clientName && <span className="error-message">{errors.clientName}</span>}
          </div>

          <div className="form-group">
            <label>Телефон</label>
            <input
              type="tel"
              placeholder="+7 (999) 123-45-67"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className={errors.clientPhone ? 'error' : ''}
            />
            {errors.clientPhone && <span className="error-message">{errors.clientPhone}</span>}
          </div>

          <div className="form-group">
            <label>Дата *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Время *</label>
            <select
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
            >
              {availableTimes.map(time => {
                const count = getSlotsCount(formData.date || '', time);
                const disabled = count >= 2;
                return (
                  <option key={time} value={time} disabled={disabled}>
                    {time} {disabled ? '(занято - 2/2)' : count > 0 ? `(${count}/2)` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Статус слота - Button Group */}
          <div className="form-group">
            <label>Статус слота</label>
            <div className="button-group">
              <button
                type="button"
                className={`btn ${status1 === 'not_confirmed' ? 'btn-selected' : 'btn-outline'}`}
                data-status="not_confirmed"
                onClick={() => setStatus1('not_confirmed')}
              >
                Не подтвердилась
              </button>
              <button
                type="button"
                className={`btn ${status1 === 'confirmed' ? 'btn-selected' : 'btn-outline'}`}
                data-status="confirmed"
                onClick={() => setStatus1('confirmed')}
              >
                Подтвердилась
              </button>
              <button
                type="button"
                className={`btn ${status1 === 'drained' ? 'btn-selected' : 'btn-outline'}`}
                data-status="drained"
                onClick={() => setStatus1('drained')}
              >
                Слив
              </button>
            </div>
          </div>

          {/* Посещение - Button Group */}
          <div className="form-group">
            <label>Посещение</label>
            <div className="button-group">
              <button
                type="button"
                className={`btn ${visitStatus === 'arrived' ? 'btn-selected' : 'btn-outline'}`}
                data-status="arrived"
                onClick={() => setVisitStatus('arrived')}
              >
                Пришла
              </button>
              <button
                type="button"
                className={`btn ${visitStatus === 'not_arrived' ? 'btn-selected' : 'btn-outline'}`}
                data-status="not_arrived"
                onClick={() => setVisitStatus('not_arrived')}
              >
                Не пришла
              </button>
              <button
                type="button"
                className={`btn ${visitStatus === 'other' ? 'btn-selected' : 'btn-outline'}`}
                data-status="other"
                onClick={() => setVisitStatus('other')}
              >
                Другое
              </button>
            </div>
          </div>

          {showComment && (
            <div className="form-group">
              <label>Комментарий *</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Обязательно укажите комментарий"
                rows={3}
                required
              />
            </div>
          )}

          {/* Статус собеседования - Button Group */}
          <div className="form-group">
            <label>Статус собеседования</label>
            <div className="button-group">
              <button
                type="button"
                className={`btn ${status2 === 'candidate_refused' ? 'btn-selected' : 'btn-outline'}`}
                data-status="candidate_refused"
                onClick={() => setStatus2(status2 === 'candidate_refused' ? '' : 'candidate_refused')}
              >
                Отказ со стороны кандидата
              </button>
              <button
                type="button"
                className={`btn ${status2 === 'our_refusal' ? 'btn-selected' : 'btn-outline'}`}
                data-status="our_refusal"
                onClick={() => setStatus2(status2 === 'our_refusal' ? '' : 'our_refusal')}
              >
                Отказ с нашей стороны
              </button>
              <button
                type="button"
                className={`btn ${status2 === 'thinking' ? 'btn-selected' : 'btn-outline'}`}
                data-status="thinking"
                onClick={() => setStatus2(status2 === 'thinking' ? '' : 'thinking')}
              >
                Думает
              </button>
            </div>
          </div>

          {showRegistration && (
            <>
              <div className="form-group">
                <label>Комментарий к регистрации</label>
                <textarea
                  value={registrationComment}
                  onChange={(e) => setRegistrationComment(e.target.value)}
                  placeholder="Дополнительные комментарии для модели..."
                  rows={3}
                />
              </div>
              
              <div className="form-group" style={{ textAlign: 'center', margin: '20px 0' }}>
                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={handleStartRegistration}
                >
                  Начать регистрацию
                </button>
              </div>
            </>
          )}

          {registrationStarted && (
            <div className="registration-fields" style={{ borderTop: '1px solid #ddd', paddingTop: '20px', marginTop: '20px' }}>
              <div className="form-group">
                <label>Дата рождения *</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className={errors.birthDate ? 'error' : ''}
                  required
                />
                {errors.birthDate && <span className="error-message">{errors.birthDate}</span>}
              </div>

              <div className="form-group">
                <label>Документ *</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className={errors.documentType ? 'error' : ''}
                  required
                >
                  <option value="">Выберите документ</option>
                  <option value="passport">Паспорт</option>
                  <option value="license">Права</option>
                  <option value="international">Загран паспорт</option>
                </select>
                {errors.documentType && <span className="error-message">{errors.documentType}</span>}
              </div>

              <div className="form-group">
                <label>Данные документа *</label>
                <input
                  type="text"
                  value={documentDetails}
                  onChange={(e) => setDocumentDetails(e.target.value)}
                  placeholder="Серия, номер и другие данные документа"
                  className={errors.documentDetails ? 'error' : ''}
                  required
                />
                {errors.documentDetails && <span className="error-message">{errors.documentDetails}</span>}
              </div>

              <div className="form-group">
                <label>Дата стажировки *</label>
                <input
                  type="date"
                  value={internshipDate}
                  onChange={(e) => setInternshipDate(e.target.value)}
                  className={errors.internshipDate ? 'error' : ''}
                  required
                />
                {errors.internshipDate && <span className="error-message">{errors.internshipDate}</span>}
              </div>

              <div className="form-group">
                <label>Загрузка фото *</label>
                <div className="file-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    style={{ display: 'none' }}
                    id="photo-upload"
                    required
                  />
                  <label htmlFor="photo-upload" className="btn btn-secondary">
                    📷 Выбрать файл
                  </label>
                  <span className="file-name">
                    {photoFile ? photoFile.name : 'Файл не выбран'}
                  </span>
                </div>
                {errors.photoFile && <span className="error-message">{errors.photoFile}</span>}
              </div>

              <div className="form-group">
                <label>Загрузка аудио *</label>
                <div className="file-upload">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    style={{ display: 'none' }}
                    id="audio-upload"
                    required
                  />
                  <label htmlFor="audio-upload" className="btn btn-secondary">
                    🎵 Выбрать файл
                  </label>
                  <span className="file-name">
                    {audioFile ? audioFile.name : 'Файл не выбран'}
                  </span>
                </div>
                {errors.audioFile && <span className="error-message">{errors.audioFile}</span>}
              </div>
            </div>
          )}
          
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Отмена
            </button>
            {registrationStarted && (
              <button type="button" onClick={handleRegister} className="btn btn-purple">
                Зарегистрировать
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
