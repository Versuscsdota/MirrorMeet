export enum ModelStatus {
  NOT_CONFIRMED = 'not_confirmed',
  NO_SHOW = 'no_show',
  ARRIVED = 'arrived',
  CONFIRMED = 'confirmed',
  DRAINED = 'drained',
  REGISTERED = 'registered',
  CANDIDATE_REFUSED = 'candidate_refused',
  OUR_REFUSAL = 'our_refusal',
  THINKING = 'thinking'
}

export interface Comment {
  text: string;
  timestamp: string; // ISO
}

export const StatusLabels: Record<ModelStatus, string> = {
  [ModelStatus.NOT_CONFIRMED]: 'Не подтвердилась',
  [ModelStatus.NO_SHOW]: 'Не пришла',
  [ModelStatus.ARRIVED]: 'Пришла',
  [ModelStatus.CONFIRMED]: 'Подтвердилась',
  [ModelStatus.DRAINED]: 'Слив',
  [ModelStatus.REGISTERED]: 'Регистрация',
  [ModelStatus.CANDIDATE_REFUSED]: 'Отказ со стороны кандидата',
  [ModelStatus.OUR_REFUSAL]: 'Отказ с нашей стороны',
  [ModelStatus.THINKING]: 'Ушла на подумать'
};

export interface Model {
  id: string;
  name: string;
  fullName?: string;
  phone?: string;
  email?: string;
  telegram?: string;
  instagram?: string;
  birthDate?: string; // YYYY-MM-DD
  documentType?: DocumentType;
  documentNumber?: string; // "Серия и номер / Номер"
  firstTrialDate?: string; // YYYY-MM-DD
  status: ModelStatus;
  notes?: string;
  tags?: string[];
  slotId?: string;  // связь со слотом
  files?: string[]; // массив путей к файлам
  comments?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export enum DocumentType {
  NOT_SPECIFIED = 'not_specified',
  RUS_PASSPORT = 'rus_passport',
  DRIVER_LICENSE = 'driver_license',
  INTERNATIONAL_PASSPORT = 'international_passport'
}

export const DocumentTypeLabels: Record<DocumentType, string> = {
  [DocumentType.NOT_SPECIFIED]: 'Не указан',
  [DocumentType.RUS_PASSPORT]: 'Паспорт РФ',
  [DocumentType.DRIVER_LICENSE]: 'Водительские права',
  [DocumentType.INTERNATIONAL_PASSPORT]: 'Загранпаспорт'
};

export interface Slot {
  id: string;
  date: string;
  time: string;
  modelId?: string;
  status: ModelStatus;
  notes?: string;
  files?: string[];
  comments?: Comment[];
  clientName?: string;
  clientPhone?: string;
  status1?: string;
  status2?: string;
  visitStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  role: 'root';
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: 'model' | 'slot' | 'user';
  entityId: string;
  userId: string;
  details: any;
  ip?: string;
  userAgent?: string;
  timestamp: string;
}
