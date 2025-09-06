export enum ModelStatus {
  NOT_CONFIRMED = 'not_confirmed',        // не подтвердилась
  NO_SHOW = 'no_show',                    // не пришла
  ARRIVED = 'arrived',                    // пришла
  CONFIRMED = 'confirmed',                // подтвердилась
  DRAINED = 'drained',                    // слив
  REGISTERED = 'registered',              // регистрация
  ACCOUNT_REGISTERED = 'account_registered', // зарегистрирована
  TRAINING = 'training',                  // стажировка
  READY_TO_WORK = 'ready_to_work',       // готова к работе
  MODEL = 'model',                        // модель
  CANDIDATE_REFUSED = 'candidate_refused', // отказ со стороны кандидата
  OUR_REFUSAL = 'our_refusal',           // отказ с нашей стороны
  THINKING = 'thinking',                  // ушла на подумать
  CLOSED_TO_TEAM = 'closed_to_team',     // закрыта к команде
  INACTIVE = 'inactive'                   // неактивна
}

export enum DocumentType {
  NOT_SPECIFIED = 'not_specified',
  RUS_PASSPORT = 'rus_passport',
  DRIVER_LICENSE = 'driver_license',
  INTERNATIONAL_PASSPORT = 'international_passport'
}

export interface Comment {
  text: string;
  timestamp: string;
}

export interface Account {
  id: string;
  site: string;
  login: string;
  password: string;
}

export interface Model {
  id: string;
  name: string;
  fullName?: string;
  phone?: string;
  email?: string;
  telegram?: string;
  instagram?: string;
  birthDate?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  firstTrialDate?: string;
  status: ModelStatus;
  notes?: string;
  tags?: string[];
  slotId?: string;  // связь со слотом
  files?: string[]; // массив путей к файлам
  comments?: Comment[];
  accounts?: Account[]; // массив вебкам аккаунтов
  createdAt: string;
  updatedAt: string;
}

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
  registeredBy?: string;
  status1?: string;
  status2?: string;
  visitStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  password?: string; // не возвращаем в API
  role: string;
  fullName?: string;
  phone?: string;
  email?: string;
  firstInternshipDate?: string;
  avatar?: string;
  permissions?: string[];
  status?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  permissions: string[];
  modules?: Record<string, ModulePermissions>;
  createdAt: string;
  updatedAt: string;
}

export interface ModulePermissions {
  view?: boolean;
  create?: boolean;
  edit?: boolean;
  delete?: boolean;
  export?: boolean;
  manage?: boolean;
  manage_roles?: boolean;
}

export interface Shift {
  id: string;
  model: string;
  modelId?: string;
  responsible: string;
  executor?: string;
  date: string;
  time: string;
  start: string;
  end: string;
  status: 'inactive' | 'pending' | 'active' | 'completed';
  totalEarnings?: number;
  address: string;
  room: string;
  type: 'regular' | 'training';
  accounts: Array<{
    platform: string;
    login: string;
    password: string;
  }>;
  sites: Array<{
    name: string;
    login: string;
    password: string;
    earnings: number;
  }>;
  screenshots: string[];
  comment: string;
  // Registration fields
  birthDate?: string;
  documentType?: 'rus_passport' | 'driver_license' | 'international_passport';
  documentData?: string;
  internshipDate?: string;
  photo?: string;
  audio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: 'model' | 'slot' | 'user' | 'shift' | 'role';
  entityId: string;
  userId: string;
  details: AuditDetails;
  ip?: string;
  userAgent?: string;
  timestamp: string;
  userDisplayName?: string;
}

export interface AuditDetails {
  oldStatus?: string;
  newStatus?: string;
  reason?: string;
  changes?: Record<string, unknown>;
  newRole?: string;
  previousRole?: string;
  changedBy?: string;
  deletedUser?: string;
  deletedRole?: string;
  [key: string]: unknown;
}
