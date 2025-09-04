import { useState, useEffect } from 'react';
import { Model } from '../types';
import { modelsAPI } from '../services/api';
import ModelModal from '../components/ModelModal';
import ModelSearch, { SearchFilters } from '../components/ModelSearch';
import { ExportModal } from '../components/ExportModal';
import toast from 'react-hot-toast';
import FileUpload from '../components/FileUpload';
import ModelCard from '../components/ModelCard';
import ModelProfile from '../components/ModelProfile';
import { ProtectedRoute } from '../components/ProtectedRoute';

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [profileFor, setProfileFor] = useState<Model | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    searchQuery: '',
    status: '',
    selectedStatuses: [],
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const data = await modelsAPI.getAll();
      setModels(data);
      setFilteredModels(data);
    } catch (error) {
      toast.error('Ошибка загрузки моделей');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort models based on search criteria
  useEffect(() => {
    let result = [...models];

    // Apply multi-status filter from filters.selectedStatuses
    if (filters.selectedStatuses && filters.selectedStatuses.length > 0) {
      result = result.filter(model => filters.selectedStatuses!.includes(model.status));
    }

    // Apply search query filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(model => 
        model.fullName?.toLowerCase().includes(query) ||
        model.phone?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filters.status) {
      result = result.filter(model => model.status === filters.status);
    }

    // Apply date range filter
    if (filters.dateFrom) {
      result = result.filter(model => 
        new Date(model.createdAt) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      const endDate = new Date(filters.dateTo);
      endDate.setHours(23, 59, 59, 999); // Include the entire day
      result = result.filter(model => 
        new Date(model.createdAt) <= endDate
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case 'name':
          aValue = a.fullName || '';
          bValue = b.fullName || '';
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredModels(result);
  }, [models, filters]);

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      status: '',
      selectedStatuses: [],
      dateFrom: '',
      dateTo: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  // removed unused handleEdit/handleDelete (actions are handled inline)

  const handleSave = async (data: Partial<Model>) => {
    try {
      if (isCreateMode) {
        await modelsAPI.create(data as any);
        toast.success('Модель создана');
      } else if (selectedModel) {
        await modelsAPI.update(selectedModel.id, data);
        toast.success('Модель обновлена');
      }
      setSelectedModel(null);
      loadModels();
    } catch (error) {
      toast.error('Ошибка сохранения');
    }
  };

  const handleFileUpload = async (modelId: string, files: File[]) => {
    try {
      await modelsAPI.uploadFiles(modelId, files);
      toast.success('Файлы загружены');
      loadModels();
      setUploadingFor(null);
    } catch (error) {
      toast.error('Ошибка загрузки файлов');
    }
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="models-page">
      <div className="models-header">
        <h2>Модели</h2>
        <button 
          className="btn btn-secondary"
          onClick={() => setIsExportModalOpen(true)}
        >
          📊 Экспорт
        </button>
      </div>

      <ModelSearch
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={resetFilters}
      />


      {filteredModels.length === 0 ? (
        <div className="empty-state">
          <h3>{models.length === 0 ? 'Нет моделей' : 'Ничего не найдено'}</h3>
          <p>{models.length === 0 ? 'Модели создаются через регистрацию в слотах' : 'Попробуйте изменить параметры поиска'}</p>
        </div>
      ) : (
        <div className="models-grid cards-v2">
          {filteredModels.map(model => (
            <div key={model.id}>
              <ModelCard model={model} onClick={(m) => setProfileFor(m)} />
              {uploadingFor === model.id && (
                <FileUpload
                  onUpload={(files) => handleFileUpload(model.id, files)}
                  onClose={() => setUploadingFor(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {selectedModel && (
        <ModelModal
          model={selectedModel}
          isOpen={!!selectedModel}
          onClose={() => setSelectedModel(null)}
          onSave={handleSave}
        />
      )}
      
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        exportType="models"
      />
      {profileFor && (
        <ProtectedRoute module="models" permission="view">
          <ModelProfile
            model={profileFor}
            onClose={() => setProfileFor(null)}
            onEdit={() => { setSelectedModel(profileFor); setIsCreateMode(false); setProfileFor(null); }}
            onDelete={() => { if (confirm('Удалить модель?')) { modelsAPI.delete(profileFor.id).then(() => { setProfileFor(null); loadModels(); }); } }}
            onModelUpdate={(updatedModel) => {
              // Обновляем модель в списке без перезагрузки
              setModels(prevModels => 
                prevModels.map(model => 
                  model.id === updatedModel.id ? updatedModel : model
                )
              );
              setProfileFor(updatedModel);
            }}
          />
        </ProtectedRoute>
      )}
    </div>
  );
}
