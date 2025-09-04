export enum ModelStatus {
  NOT_CONFIRMED = 'not_confirmed',        // не подтвердилась
  NO_SHOW = 'no_show',                    // не пришла
  ARRIVED = 'arrived',                    // пришла
  CONFIRMED = 'confirmed',                // подтвердилась
  DRAINED = 'drained',                    // слив
  REGISTERED = 'registered',              // регистрация
  CANDIDATE_REFUSED = 'candidate_refused', // отказ со стороны кандидата
  OUR_REFUSAL = 'our_refusal',           // отказ с нашей стороны
  THINKING = 'thinking'                   // ушла на подумать
}

export enum DocumentType {
  PASSPORT = 'passport',
  LICENSE = 'license',
  INTERNATIONAL = 'international'
}

export interface Comment {
  text: string;
  timestamp: string;
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
  role: 'root';
  createdAt: string;
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
