export enum ModelStatus {
  NOT_CONFIRMED = 'not_confirmed',
  NO_SHOW = 'no_show',
  ARRIVED = 'arrived',
  CONFIRMED = 'confirmed',
  DRAINED = 'drained',
  REGISTERED = 'registered',
  ACCOUNT_REGISTERED = 'account_registered',
  CANDIDATE_REFUSED = 'candidate_refused',
  OUR_REFUSAL = 'our_refusal',
  THINKING = 'thinking',
  TRAINING = 'training',
  CLOSED_TO_TEAM = 'closed_to_team',
  READY_TO_WORK = 'ready_to_work',
  MODEL = 'model',
  INACTIVE = 'inactive'
}

export interface Comment {
  text: string;
  timestamp: string; // ISO
}

export interface Account {
  id: string;
  site: string; // название сайта (Chaturbate, OnlyFans, etc.)
  login: string;
  password: string;
}

export const StatusLabels: Record<ModelStatus, string> = {
  [ModelStatus.NOT_CONFIRMED]: 'Не подтвердилась',
  [ModelStatus.NO_SHOW]: 'Не пришла',
  [ModelStatus.ARRIVED]: 'Пришла',
  [ModelStatus.CONFIRMED]: 'Подтвердилась',
  [ModelStatus.DRAINED]: 'Слив',
  [ModelStatus.REGISTERED]: 'Регистрация',
  [ModelStatus.ACCOUNT_REGISTERED]: 'Зарегистрирована',
  [ModelStatus.CANDIDATE_REFUSED]: 'Отказ со стороны кандидата',
  [ModelStatus.OUR_REFUSAL]: 'Отказ с нашей стороны',
  [ModelStatus.THINKING]: 'Ушла на подумать',
  [ModelStatus.TRAINING]: 'Стажировка',
  [ModelStatus.CLOSED_TO_TEAM]: 'Закрыта к команде',
  [ModelStatus.READY_TO_WORK]: 'Готова к работе',
  [ModelStatus.MODEL]: 'Модель',
  [ModelStatus.INACTIVE]: 'Неактивна'
};

export interface Model {
  id: string;
  name: string;
  fullName?: string;
  phone?: string;
  telegram?: string;
  instagram?: string;
  birthDate?: string; // YYYY-MM-DD
  documentType?: DocumentType;
  documentNumber?: string; // "Серия и номер / Номер"
  firstTrialDate?: string; // YYYY-MM-DD
  status: ModelStatus;
  slotId?: string;  // связь со слотом
  files?: string[]; // массив путей к файлам
  comments?: Comment[];
  accounts?: Account[]; // массив вебкам аккаунтов
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

export interface Role {
  id: string;
  name: string;
  displayName: string;
  permissions: string[];
  modules: Record<string, any>;
}

export interface User {
  id: string;
  username: string;
  role: string | Role;
  fullName?: string;
  phone?: string;
  email?: string;
  status?: string;
  firstInternshipDate?: string;
  avatar?: string;
}

export interface Shift {
  id: string;
  model: string;
  responsible?: string;
  producer?: string;
  executor?: string;
  address: string;
  room: string;
  date: string;
  time: string;
  start?: string;
  end?: string;
  type: 'regular' | 'training';
  status: 'inactive' | 'pending' | 'active' | 'completed' | 'upcoming';
  comment?: string;
  screenshots?: string[];
  accounts?: any[];
  sites?: string[];
  totalEarnings?: number;
  actualStartTime?: string;
  actualEndTime?: string;
  actualDuration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftHistory {
  id: string;
  shiftId: string;
  modelId?: string;
  employeeId?: string;
  shiftType: 'regular' | 'training';
  date: string;
  duration: number; // в минутах
  earnings?: number;
  status: 'completed' | 'cancelled';
  producer: string;
  executor?: string;
  address: string;
  room: string;
  comment?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: 'model' | 'slot' | 'user' | 'shift';
  entityId: string;
  userId: string;
  details: any;
  ip?: string;
  userAgent?: string;
  timestamp: string;
}
