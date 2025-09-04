import { Model, StatusLabels } from '../types';
import { statusColors } from './StatusSelector';

interface ModelCardProps {
  model: Model;
  onClick: (model: Model) => void;
}

export default function ModelCard({ model, onClick }: ModelCardProps) {
  const toUrl = (p: string) => p.startsWith('/uploads/') ? p : `/uploads/${p}`;
  const avatar = (model.files && model.files[0]) ? toUrl(model.files[0]) : undefined;
  return (
    <button className="card model-card v2" onClick={() => onClick(model)}>
      <div className="model-card-avatar">
        {avatar ? (
          <img src={avatar} alt={model.name} />
        ) : (
          <div className="avatar-fallback" aria-hidden>
            {model.name?.slice(0,1) || 'M'}
          </div>
        )}
      </div>
      <div className="model-card-name">{model.fullName || model.name}</div>
      <div className="model-card-line tg">
        <span className="icon">📨</span>
        <span className="value">{model.telegram ? `@${model.telegram}` : '—'}</span>
      </div>
      <div className="model-card-line phone">
        <span className="icon">📞</span>
        <span className="value">{model.phone || '—'}</span>
      </div>
      <div className="model-card-status">
        <div 
          className="status-badge"
          style={{ 
            backgroundColor: statusColors[model.status],
            color: '#fff'
          }}
        >
          {StatusLabels[model.status]}
        </div>
      </div>
    </button>
  );
}
