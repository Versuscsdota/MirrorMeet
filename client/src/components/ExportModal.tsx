import React, { useState } from 'react';
import { ModelStatus } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportType: 'models' | 'slots' | 'report';
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, exportType }) => {
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    searchQuery: ''
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let url = `/api/export/${exportType}?format=${format}`;
      
      if (exportType === 'models') {
        if (filters.status) url += `&status=${filters.status}`;
        if (filters.dateFrom) url += `&dateFrom=${filters.dateFrom}`;
        if (filters.dateTo) url += `&dateTo=${filters.dateTo}`;
        if (filters.searchQuery) url += `&searchQuery=${encodeURIComponent(filters.searchQuery)}`;
      } else if (exportType === 'slots' || exportType === 'report') {
        if (filters.dateFrom) url += `&dateFrom=${filters.dateFrom}`;
        if (filters.dateTo) url += `&dateTo=${filters.dateTo}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Ошибка экспорта');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || `export.${format}`;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      alert('Ошибка при экспорте данных');
    } finally {
      setIsExporting(false);
    }
  };

  const getTitle = () => {
    switch (exportType) {
      case 'models': return 'Экспорт моделей';
      case 'slots': return 'Экспорт расписания';
      case 'report': return 'Отчет по периоду';
      default: return 'Экспорт';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal export-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{getTitle()}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label>Формат файла:</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  value="xlsx"
                  checked={format === 'xlsx'}
                  onChange={(e) => setFormat(e.target.value as 'xlsx')}
                />
                Excel (.xlsx)
              </label>
              <label>
                <input
                  type="radio"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={(e) => setFormat(e.target.value as 'csv')}
                />
                CSV (.csv)
              </label>
            </div>
          </div>

          {exportType === 'models' && (
            <>
              <div className="form-group">
                <label>Статус модели:</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="">Все статусы</option>
                  <option value={ModelStatus.NOT_CONFIRMED}>Не подтверждена</option>
                  <option value={ModelStatus.CONFIRMED}>Подтверждена</option>
                  <option value={ModelStatus.DRAINED}>Слита</option>
                  <option value={ModelStatus.REGISTERED}>Зарегистрирована</option>
                  <option value={ModelStatus.CANDIDATE_REFUSED}>Отказ кандидата</option>
                  <option value={ModelStatus.OUR_REFUSAL}>Наш отказ</option>
                  <option value={ModelStatus.THINKING}>Думает</option>
                  <option value={ModelStatus.ARRIVED}>Пришла</option>
                  <option value={ModelStatus.NO_SHOW}>Не пришла</option>
                </select>
              </div>

              <div className="form-group">
                <label>Поиск по имени/телефону/email:</label>
                <input
                  type="text"
                  value={filters.searchQuery}
                  onChange={(e) => setFilters({...filters, searchQuery: e.target.value})}
                  placeholder="Введите текст для поиска..."
                />
              </div>
            </>
          )}

          {(exportType === 'slots' || exportType === 'report' || exportType === 'models') && (
            <div className="date-range">
              <div className="form-group">
                <label>Дата с:</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Дата по:</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                />
              </div>
            </div>
          )}

          {exportType === 'report' && (!filters.dateFrom || !filters.dateTo) && (
            <div className="alert alert-warning">
              Для создания отчета необходимо указать период (дата с и дата по)
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={isExporting}>
            Отмена
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleExport}
            disabled={isExporting || (exportType === 'report' && (!filters.dateFrom || !filters.dateTo))}
          >
            {isExporting ? 'Экспорт...' : 'Скачать'}
          </button>
        </div>
      </div>
    </div>
  );
};
