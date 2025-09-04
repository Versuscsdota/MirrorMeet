import { useState } from 'react';
import { ModelStatus } from '../types';

export interface SearchFilters {
  searchQuery: string;
  status: ModelStatus | '';
  dateFrom: string;
  dateTo: string;
  sortBy: 'name' | 'createdAt' | 'status';
  sortOrder: 'asc' | 'desc';
}

interface ModelSearchProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onReset: () => void;
}

const statusLabels: Record<ModelStatus, string> = {
  [ModelStatus.NOT_CONFIRMED]: 'Не подтверждена',
  [ModelStatus.CONFIRMED]: 'Подтверждена',
  [ModelStatus.DRAINED]: 'Слита',
  [ModelStatus.CANDIDATE_REFUSED]: 'Отказ кандидата',
  [ModelStatus.OUR_REFUSAL]: 'Наш отказ',
  [ModelStatus.THINKING]: 'Думает',
  [ModelStatus.REGISTERED]: 'Зарегистрирована',
  [ModelStatus.NO_SHOW]: 'Не пришла',
  [ModelStatus.ARRIVED]: 'Пришла'
};

export default function ModelSearch({ filters, onFiltersChange, onReset }: ModelSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleInputChange = (field: keyof SearchFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  const hasActiveFilters = filters.searchQuery || filters.status || filters.dateFrom || filters.dateTo;

  return (
    <div className="model-search">
      <div className="search-main">
        <div className="search-input-group">
          <input
            type="text"
            placeholder="Поиск по ФИО, телефону..."
            value={filters.searchQuery}
            onChange={(e) => handleInputChange('searchQuery', e.target.value)}
            className="search-input"
          />
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            🔍 Фильтры {hasActiveFilters && '●'}
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onReset}
            >
              Сбросить
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="search-filters">
          <div className="filters-row">
            <div className="filter-group">
              <label>Статус</label>
              <select
                value={filters.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                <option value="">Все статусы</option>
                {Object.entries(statusLabels).map(([status, label]) => (
                  <option key={status} value={status}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Дата регистрации от</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleInputChange('dateFrom', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Дата регистрации до</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleInputChange('dateTo', e.target.value)}
              />
            </div>
          </div>

          <div className="filters-row">
            <div className="filter-group">
              <label>Сортировка</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleInputChange('sortBy', e.target.value)}
              >
                <option value="createdAt">По дате регистрации</option>
                <option value="name">По ФИО</option>
                <option value="status">По статусу</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Порядок</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleInputChange('sortOrder', e.target.value)}
              >
                <option value="desc">По убыванию</option>
                <option value="asc">По возрастанию</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
