import { useState, useEffect } from 'react';
import { DocumentType, DocumentTypeLabels, Model, Comment, ModelStatus, AuditLog, Account } from '../types';
import { auditAPI, modelsAPI } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { usePermissions } from '../hooks/usePermissions';
import StatusSelector from './StatusSelector';
import ShiftHistory from './ShiftHistory';
import AccountsModal from './AccountsModal';

const UPLOADS_PATH_PREFIX = '/uploads/';

interface ModelProfileProps {
  model: Model;
  onClose: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  onModelUpdate?: (updatedModel: Model) => void;
}

interface ModelProfileState {
  modelData: Model;
  selectedStatuses: ModelStatus[];
  auditLogs: AuditLog[];
  isAccountsModalOpen: boolean;
  commentText: string;
}

export default function ModelProfile({ model, onClose, onEdit, onDelete, onModelUpdate }: ModelProfileProps) {
  const { hasPermission } = usePermissions();
  const [profileState, setProfileState] = useState<ModelProfileState>({
    modelData: model,
    selectedStatuses: [model.status],
    auditLogs: [],
    isAccountsModalOpen: false,
    commentText: ''
  });

  const buildFileUrl = (filePath: string): string => {
    return filePath.startsWith(UPLOADS_PATH_PREFIX) ? filePath : `${UPLOADS_PATH_PREFIX}${filePath}`;
  };

  const getAvatarUrl = (): string | undefined => {
    const firstFile = profileState.modelData.files?.[0];
    return firstFile ? buildFileUrl(firstFile) : undefined;
  };

  useEffect(() => {
    setProfileState(prev => ({ ...prev, modelData: model, selectedStatuses: [model.status] }));
  }, [model]);

  const loadModelAuditLogs = async (modelId: string): Promise<void> => {
    // Check if user has permission to view audit logs
    if (!hasPermission('audit', 'view')) {
      console.log('No permission to view audit logs');
      return;
    }

    try {
      const { items } = await auditAPI.getAll();
      const statusChangeFilters = ['status', 'Статус', 'изменен'];
      
      const filteredLogs = items
        .filter(log => 
          log.entityType === 'model' && 
          log.entityId === modelId && 
          statusChangeFilters.some(filter => log.action.includes(filter))
        )
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setProfileState(prev => ({ ...prev, auditLogs: filteredLogs }));
    } catch (error) {
      console.warn('Failed to load audit logs:', error);
    }
  };

  useEffect(() => {
    loadModelAuditLogs(profileState.modelData.id);
  }, [profileState.modelData.id]);

  // Обновляем данные модели только при изменениях статуса или других полей
  const refreshModelData = async (): Promise<void> => {
    try {
      const updatedModel = await modelsAPI.getById(profileState.modelData.id);
      if (updatedModel) {
        // Проверяем, есть ли реальные изменения
        const hasChanges = 
          updatedModel.status !== profileState.modelData.status ||
          updatedModel.name !== profileState.modelData.name ||
          JSON.stringify(updatedModel.files) !== JSON.stringify(profileState.modelData.files) ||
          JSON.stringify(updatedModel.comments) !== JSON.stringify(profileState.modelData.comments);
        
        if (hasChanges) {
          setProfileState(prev => ({ 
            ...prev, 
            modelData: updatedModel, 
            selectedStatuses: [updatedModel.status] 
          }));
          onModelUpdate?.(updatedModel);
        }
      }
    } catch (error) {
      console.error('Failed to refresh model data:', error);
    }
  };

  const addCommentToModel = async (): Promise<void> => {
    const trimmedComment = profileState.commentText.trim();
    if (!trimmedComment) return;
    
    const { user } = useAuthStore.getState();
    const newComment: Comment = { 
      text: trimmedComment, 
      timestamp: new Date().toISOString(),
      userId: user?.id,
      username: user?.username
    };
    
    const updatedComments = [...(profileState.modelData.comments || []), newComment];
    const updatedModel = await modelsAPI.update(profileState.modelData.id, { comments: updatedComments });
    
    setProfileState(prev => ({
      ...prev,
      modelData: updatedModel,
      commentText: ''
    }));
  };

  const setFileAsMain = async (targetFile: string): Promise<void> => {
    const currentFiles = profileState.modelData.files || [];
    const reorderedFiles = [targetFile, ...currentFiles.filter(file => file !== targetFile)];
    
    const updatedModel = await modelsAPI.update(profileState.modelData.id, { files: reorderedFiles });
    setProfileState(prev => ({ ...prev, modelData: updatedModel }));
  };

  const removeFileFromModel = async (targetFile: string): Promise<void> => {
    const filteredFiles = (profileState.modelData.files || []).filter(file => file !== targetFile);
    const updatedModel = await modelsAPI.update(profileState.modelData.id, { files: filteredFiles });
    setProfileState(prev => ({ ...prev, modelData: updatedModel }));
  };

  const updateModelStatus = async (newStatus: ModelStatus): Promise<void> => {
    try {
      const updatedModel = await modelsAPI.update(profileState.modelData.id, { status: newStatus });
      
      setProfileState(prev => ({ ...prev, modelData: updatedModel }));
      onModelUpdate?.(updatedModel);
      
      await loadModelAuditLogs(profileState.modelData.id);
    } catch (error) {
      console.error('Failed to update model status:', error);
    }
  };

  // Обновляем данные при изменениях в других компонентах
  const handleRefresh = (): void => {
    refreshModelData();
  };

  const saveModelAccounts = async (accounts: Account[]): Promise<void> => {
    try {
      const shouldAutoChangeStatus = accounts.length > 0 && profileState.modelData.status !== ModelStatus.ACCOUNT_REGISTERED;
      const updateData: Partial<Model> = { accounts };
      
      if (shouldAutoChangeStatus) {
        updateData.status = ModelStatus.ACCOUNT_REGISTERED;
      }
      
      const updatedModel = await modelsAPI.update(profileState.modelData.id, updateData);
      
      setProfileState(prev => ({
        ...prev,
        modelData: updatedModel,
        selectedStatuses: shouldAutoChangeStatus ? [ModelStatus.ACCOUNT_REGISTERED] : prev.selectedStatuses
      }));
      
      onModelUpdate?.(updatedModel);
    } catch (error) {
      console.error('Failed to update model accounts:', error);
    }
  };

  const uploadFilesToModel = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;
    
    const updatedModel = await modelsAPI.uploadFiles(profileState.modelData.id, selectedFiles);
    setProfileState(prev => ({ ...prev, modelData: updatedModel }));
    
    event.target.value = '';
  };

  return (
    <div className="modal model-profile-modal">
      <div className="modal-content model-profile">
        <div className="modal-header">
          <h2>Профиль модели</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="profile-header">
          <div className="avatar">
            {getAvatarUrl() ? (
              <img src={getAvatarUrl()} alt={profileState.modelData.name} />
            ) : (
              <div className="avatar-fallback">
                {profileState.modelData.name?.slice(0,1) || 'M'}
              </div>
            )}
          </div>
          <div className="names">
            <div className="full">{profileState.modelData.fullName || profileState.modelData.name}</div>
            {profileState.modelData.name && profileState.modelData.fullName && (
              <div className="short">{profileState.modelData.name}</div>
            )}
          </div>
          <div className="status-section">
            <StatusSelector 
              selectedStatuses={profileState.selectedStatuses}
              onMultiStatusChange={(statuses: ModelStatus[]) => {
                setProfileState(prev => ({ ...prev, selectedStatuses: statuses }));
                
                const latestStatus = statuses[statuses.length - 1];
                if (latestStatus && latestStatus !== profileState.modelData.status) {
                  updateModelStatus(latestStatus);
                }
              }}
              className="profile-status-selector"
            />
          </div>
        </div>

        <div className="profile-columns">
          <div className="column">
            <Section title="Личная информация">
              <InfoRow label="Телеграмм" value={profileState.modelData.telegram ? `@${profileState.modelData.telegram}` : '—'} />
              <InfoRow label="ФИО" value={profileState.modelData.fullName || profileState.modelData.name || '—'} />
              <InfoRow label="Телефон" value={profileState.modelData.phone || '—'} />
              <InfoRow label="Дата рождения" value={profileState.modelData.birthDate || '—'} />
              <InfoRow label="Дата первой стажировки" value={profileState.modelData.firstTrialDate || '—'} />
            </Section>

            <Section title="Документы">
              <InfoRow 
                label="Тип документа" 
                value={profileState.modelData.documentType ? DocumentTypeLabels[profileState.modelData.documentType] : DocumentTypeLabels[DocumentType.NOT_SPECIFIED]} 
              />
              <InfoRow label="Серия и номер / Номер" value={profileState.modelData.documentNumber || '—'} />
            </Section>

            <Section title="Аккаунты">
              <button 
                className="btn btn-secondary"
                onClick={() => setProfileState(prev => ({ ...prev, isAccountsModalOpen: true }))}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span>⚙️</span>
                Управление аккаунтами ({(profileState.modelData.accounts || []).length})
              </button>
            </Section>
          </div>

          <div className="column">
            <Section title="Файлы" action={<label className="btn btn-primary" style={{marginLeft: 'auto'}}>
              Загрузить
              <input type="file" multiple hidden onChange={uploadFilesToModel} />
            </label>}>
              <div className="files-list">
                {(profileState.modelData.files || []).length === 0 ? (
                  <div className="muted">Файлов нет</div>
                ) : (
                  (profileState.modelData.files || []).map((file) => (
                    <div className="file-row" key={file}>
                      <div className="preview">
                        <img src={buildFileUrl(file)} alt="file" />
                      </div>
                      <div className="meta">
                        <div className="name">
                          {file.split('/').pop()}
                        </div>
                        <div className="controls">
                          <button className="btn btn-secondary btn-sm" onClick={() => setFileAsMain(file)}>Сделать главной</button>
                          <a className="btn btn-secondary btn-sm" href={buildFileUrl(file)} target="_blank" rel="noreferrer">Скачать</a>
                          <button className="btn btn-danger btn-sm" onClick={() => removeFileFromModel(file)}>Удалить</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Section>

            <Section title="Комментарии">
              <div className="comments">
                <div className="comments-list">
                  {(profileState.modelData.comments || []).length === 0 ? (
                    <div className="muted">Комментариев нет</div>
                  ) : (
                    (profileState.modelData.comments || []).slice().reverse().map((comment, index) => (
                      <div key={index} className="comment">
                        <div className="time">{new Date(comment.timestamp).toLocaleString()} {comment.username || 'Неизвестный пользователь'}</div>
                        <div className="text">{comment.text}</div>
                      </div>
                    ))
                  )}
                </div>
                <div className="comments-add">
                  <input
                    type="text"
                    placeholder="Добавить комментарий..."
                    value={profileState.commentText}
                    onChange={(e) => setProfileState(prev => ({ ...prev, commentText: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') addCommentToModel(); }}
                  />
                  <button className="btn btn-primary" onClick={addCommentToModel}>▶</button>
                </div>
              </div>
            </Section>

            <Section title="История смен">
              <ShiftHistory 
                modelId={profileState.modelData.name || profileState.modelData.id} 
                title="Смены модели"
              />
            </Section>
          </div>
        </div>

        {hasPermission('audit', 'view') && (
          <Section title="История статусов">
            <div className="status-log">
              {profileState.auditLogs.length === 0 ? (
                <div className="muted">Нет событий</div>
              ) : (
                profileState.auditLogs.map((log) => (
                  <div key={log.id} className="log-row">
                    <div className="log-time">{new Date(log.timestamp).toLocaleString()}</div>
                    <div className="log-text">{log.action}</div>
                  </div>
                ))
              )}
            </div>
          </Section>
        )}

        <div className="modal-footer actions">
          {onDelete && <button className="btn btn-danger" onClick={onDelete}>Удалить</button>}
          <button className="btn btn-outline" onClick={handleRefresh} title="Обновить данные">🔄</button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-secondary" onClick={onEdit}>Изменить</button>
          <button className="btn btn-primary" onClick={onClose}>Готово</button>
        </div>

        <AccountsModal
          accounts={profileState.modelData.accounts || []}
          isOpen={profileState.isAccountsModalOpen}
          onClose={() => setProfileState(prev => ({ ...prev, isAccountsModalOpen: false }))}
          onSave={saveModelAccounts}
        />
      </div>

    </div>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title">{title}</div>
        {action}
      </div>
      <div className="section-body">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-row">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}
