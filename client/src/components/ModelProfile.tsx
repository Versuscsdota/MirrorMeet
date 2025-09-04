import { useEffect, useState } from 'react';
import { DocumentType, DocumentTypeLabels, Model, Comment, ModelStatus, StatusLabels } from '../types';
import { auditAPI, modelsAPI } from '../services/api';
import FilePreview from './FilePreview';
import StatusSelector from './StatusSelector';

interface ModelProfileProps {
  model: Model;
  onClose: () => void;
  onEdit: () => void;
  onDelete?: () => void;
}

export default function ModelProfile({ model, onClose, onEdit, onDelete }: ModelProfileProps) {
  const [data, setData] = useState<Model>(model);
  const [commentText, setCommentText] = useState<string>('');
  const [logs, setLogs] = useState<any[]>([]);
  const [previewFile, setPreviewFile] = useState<{ path: string; name: string } | null>(null);
  const [showStatusSelector, setShowStatusSelector] = useState(false);

  const toUrl = (p: string) => p.startsWith('/uploads/') ? p : `/uploads/${p}`;
  const avatar = (data.files && data.files[0]) ? toUrl(data.files[0]) : undefined;

  useEffect(() => {
    setData(model);
  }, [model]);

  useEffect(() => {
    // load audit logs and filter by this model - only status changes
    auditAPI.getAll().then(({ items }) => {
      const filtered = items.filter((l) => 
        l.entityType === 'model' && 
        l.entityId === data.id && 
        l.action.includes('status')
      );
      setLogs(filtered);
    }).catch(() => {});
  }, [data.id]);

  const addComment = async () => {
    if (!commentText.trim()) return;
    const newComment: Comment = { text: commentText.trim(), timestamp: new Date().toISOString() };
    const next = { comments: [...(data.comments || []), newComment] };
    const updated = await modelsAPI.update(data.id, next);
    setData(updated);
    setCommentText('');
  };

  const setMainFile = async (file: string) => {
    const files = (data.files || []);
    const reordered = [file, ...files.filter(f => f !== file)];
    const updated = await modelsAPI.update(data.id, { files: reordered });
    setData(updated);
  };

  const deleteFile = async (file: string) => {
    const files = (data.files || []).filter(f => f !== file);
    const updated = await modelsAPI.update(data.id, { files });
    setData(updated);
  };

  const updateStatus = async (newStatus: ModelStatus) => {
    const updated = await modelsAPI.update(data.id, { status: newStatus });
    setData(updated);
    setShowStatusSelector(false);
    // Refresh logs to show new status change
    auditAPI.getAll().then(({ items }) => {
      const filtered = items.filter((l) => 
        l.entityType === 'model' && 
        l.entityId === data.id && 
        l.action.includes('status')
      );
      setLogs(filtered);
    }).catch(() => {});
  };

  const handleUploadInline = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const updated = await modelsAPI.uploadFiles(data.id, files);
    setData(updated);
    e.target.value = '';
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
            {avatar ? <img src={avatar} alt={data.name} /> : <div className="avatar-fallback">{data.name?.slice(0,1) || 'M'}</div>}
          </div>
          <div className="names">
            <div className="full">{data.fullName || data.name}</div>
            {data.name && data.fullName && <div className="short">{data.name}</div>}
          </div>
          <div className="status-display">
            <div className="current-status">
              <span className={`status-badge status-${data.status}`}>
                {StatusLabels[data.status]}
              </span>
              <button 
                className="status-edit-btn"
                onClick={() => setShowStatusSelector(true)}
                title="Изменить статус"
              >
                ⚙️
              </button>
            </div>
          </div>
        </div>

        <div className="profile-columns">
          <div className="column">
            <Section title="Личная информация">
              <InfoRow label="Статус" value={StatusLabels[data.status]} />
              <InfoRow label="Телеграмм" value={data.telegram ? `@${data.telegram}` : '—'} />
              <InfoRow label="ФИО" value={data.fullName || data.name || '—'} />
              <InfoRow label="Телефон" value={data.phone || '—'} />
              <InfoRow label="Дата рождения" value={data.birthDate || '—'} />
              <InfoRow label="Дата первой стажировки" value={data.firstTrialDate || '—'} />
            </Section>

            <Section title="Документы">
              <InfoRow label="Тип документа" value={data.documentType ? DocumentTypeLabels[data.documentType] : DocumentTypeLabels[DocumentType.NOT_SPECIFIED]} />
              <InfoRow label="Серия и номер / Номер" value={data.documentNumber || '—'} />
            </Section>
          </div>

          <div className="column">
            <Section title="Файлы" action={<label className="btn btn-primary" style={{marginLeft: 'auto'}}>
              Загрузить
              <input type="file" multiple hidden onChange={handleUploadInline} />
            </label>}>
              <div className="files-list">
                {(data.files || []).length === 0 ? (
                  <div className="muted">Файлов нет</div>
                ) : (
                  (data.files || []).map((f) => (
                    <div className="file-row" key={f}>
                      <div className="preview" onClick={() => setPreviewFile({ path: f, name: f.split('/').pop() || f })}>
                        <img src={toUrl(f)} alt="file" />
                      </div>
                      <div className="meta">
                        <div className="name" onClick={() => setPreviewFile({ path: f, name: f.split('/').pop() || f })}>
                          {f.split('/').pop()}
                        </div>
                        <div className="controls">
                          <button className="btn btn-secondary btn-sm" onClick={() => setPreviewFile({ path: f, name: f.split('/').pop() || f })}>Просмотр</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setMainFile(f)}>Сделать главной</button>
                          <a className="btn btn-secondary btn-sm" href={toUrl(f)} target="_blank" rel="noreferrer">Скачать</a>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteFile(f)}>Удалить</button>
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
                  {(data.comments || []).length === 0 ? (
                    <div className="muted">Комментариев нет</div>
                  ) : (
                    (data.comments || []).slice().reverse().map((c, idx) => (
                      <div key={idx} className="comment">
                        <div className="time">{new Date(c.timestamp).toLocaleString()}</div>
                        <div className="text">{c.text}</div>
                      </div>
                    ))
                  )}
                </div>
                <div className="comments-add">
                  <input
                    type="text"
                    placeholder="Добавить комментарий..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addComment(); }}
                  />
                  <button className="btn btn-primary" onClick={addComment}>▶</button>
                </div>
              </div>
            </Section>
          </div>
        </div>

        <Section title="Рабочая история статусов">
          <div className="status-log">
            {logs.length === 0 ? (
              <div className="muted">Нет изменений статуса</div>
            ) : (
              logs.slice().reverse().map((l) => (
                <div key={l.id} className="log-row">
                  <div className="log-time">{new Date(l.timestamp).toLocaleString()}</div>
                  <div className="log-text">{l.action}</div>
                  {l.details && (
                    <div className="log-details">
                      {l.details.oldValue && <span className="old-status">Было: {StatusLabels[l.details.oldValue as ModelStatus] || l.details.oldValue}</span>}
                      {l.details.newValue && <span className="new-status">Стало: {StatusLabels[l.details.newValue as ModelStatus] || l.details.newValue}</span>}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Section>

        <div className="modal-footer actions">
          {onDelete && <button className="btn btn-danger" onClick={onDelete}>Удалить</button>}
          <div style={{ flex: 1 }} />
          <button className="btn btn-secondary" onClick={onEdit}>Изменить</button>
          <button className="btn btn-primary" onClick={onClose}>Готово</button>
        </div>
      </div>
      
      {previewFile && (
        <FilePreview
          filePath={previewFile.path}
          fileName={previewFile.name}
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
      
      {showStatusSelector && (
        <StatusSelector
          currentStatus={data.status}
          onStatusSelect={updateStatus}
          onClose={() => setShowStatusSelector(false)}
        />
      )}
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
