import { ModelStatus, StatusLabels } from '../types';

export interface StatusTransitionRule {
  fromStatus: ModelStatus;
  toStatus: ModelStatus;
  condition: {
    shiftType: 'regular' | 'training';
    completedShiftsCount: number;
  };
}

// Правила автоматического изменения статусов моделей
export const STATUS_TRANSITION_RULES: StatusTransitionRule[] = [
  // После первой стажировочной смены: registered -> training
  {
    fromStatus: ModelStatus.REGISTERED,
    toStatus: ModelStatus.TRAINING,
    condition: {
      shiftType: 'training',
      completedShiftsCount: 1
    }
  },
  
  // После второй стажировочной смены: training -> closed_to_team
  {
    fromStatus: ModelStatus.TRAINING,
    toStatus: ModelStatus.CLOSED_TO_TEAM,
    condition: {
      shiftType: 'training',
      completedShiftsCount: 2
    }
  },
  
  // После первой рабочей смены: closed_to_team -> ready_to_work
  {
    fromStatus: ModelStatus.CLOSED_TO_TEAM,
    toStatus: ModelStatus.READY_TO_WORK,
    condition: {
      shiftType: 'regular',
      completedShiftsCount: 1
    }
  },
  
  // После второй рабочей смены: ready_to_work -> model
  {
    fromStatus: ModelStatus.READY_TO_WORK,
    toStatus: ModelStatus.MODEL,
    condition: {
      shiftType: 'regular',
      completedShiftsCount: 2
    }
  }
];

export interface ModelShiftStats {
  trainingShiftsCompleted: number;
  regularShiftsCompleted: number;
  totalShiftsCompleted: number;
}

export class StatusManager {
  /**
   * Определяет новый статус модели на основе завершенной смены
   */
  static calculateNewStatus(
    currentStatus: ModelStatus,
    completedShiftType: 'regular' | 'training',
    shiftStats: ModelShiftStats
  ): ModelStatus {
    // Находим применимое правило
    const applicableRule = STATUS_TRANSITION_RULES.find(rule => {
      const isStatusMatch = rule.fromStatus === currentStatus;
      const isShiftTypeMatch = rule.condition.shiftType === completedShiftType;
      
      let isCountMatch = false;
      if (completedShiftType === 'training') {
        isCountMatch = shiftStats.trainingShiftsCompleted >= rule.condition.completedShiftsCount;
      } else {
        isCountMatch = shiftStats.regularShiftsCompleted >= rule.condition.completedShiftsCount;
      }
      
      return isStatusMatch && isShiftTypeMatch && isCountMatch;
    });

    return applicableRule ? applicableRule.toStatus : currentStatus;
  }

  /**
   * Проверяет, должен ли статус измениться после завершения смены
   */
  static shouldUpdateStatus(
    currentStatus: ModelStatus,
    completedShiftType: 'regular' | 'training',
    shiftStats: ModelShiftStats
  ): boolean {
    const newStatus = this.calculateNewStatus(currentStatus, completedShiftType, shiftStats);
    return newStatus !== currentStatus;
  }

  /**
   * Получает описание изменения статуса
   */
  static getStatusChangeDescription(
    fromStatus: ModelStatus,
    toStatus: ModelStatus,
    shiftType: 'regular' | 'training'
  ): string {
    const shiftTypeLabel = shiftType === 'training' ? 'стажировочной' : 'рабочей';
    
    return `Статус изменен с "${StatusLabels[fromStatus]}" на "${StatusLabels[toStatus]}" после завершения ${shiftTypeLabel} смены`;
  }

  /**
   * Получает следующий возможный статус для модели
   */
  static getNextPossibleStatus(
    currentStatus: ModelStatus,
    shiftStats: ModelShiftStats
  ): { status: ModelStatus; requirement: string } | null {
    // Ищем следующее правило для текущего статуса
    const nextRule = STATUS_TRANSITION_RULES.find(rule => rule.fromStatus === currentStatus);
    
    if (!nextRule) {
      return null;
    }

    const shiftTypeLabel = nextRule.condition.shiftType === 'training' ? 'стажировочных' : 'рабочих';
    const currentCount = nextRule.condition.shiftType === 'training' 
      ? shiftStats.trainingShiftsCompleted 
      : shiftStats.regularShiftsCompleted;
    
    const remaining = Math.max(0, nextRule.condition.completedShiftsCount - currentCount);
    
    return {
      status: nextRule.toStatus,
      requirement: remaining > 0 
        ? `Требуется еще ${remaining} ${shiftTypeLabel} ${remaining === 1 ? 'смена' : 'смен'}`
        : 'Готово к изменению статуса'
    };
  }

  /**
   * Валидирует возможность создания смены для модели с текущим статусом
   */
  static canCreateShift(
    modelStatus: ModelStatus,
    shiftType: 'regular' | 'training'
  ): { allowed: boolean; reason?: string } {
    // Правила для стажировочных смен
    if (shiftType === 'training') {
      if ([ModelStatus.REGISTERED, ModelStatus.ACCOUNT_REGISTERED, ModelStatus.TRAINING].includes(modelStatus)) {
        return { allowed: true };
      }
      return { 
        allowed: false, 
        reason: 'Стажировочные смены доступны только для моделей со статусом "Регистрация", "Зарегистрирована" или "Стажировка"' 
      };
    }

    // Правила для рабочих смен
    if (shiftType === 'regular') {
      if ([ModelStatus.CLOSED_TO_TEAM, ModelStatus.READY_TO_WORK, ModelStatus.MODEL].includes(modelStatus)) {
        return { allowed: true };
      }
      return { 
        allowed: false, 
        reason: 'Рабочие смены доступны только для моделей со статусом "Закрыта к команде", "Готова к работе" или "Модель"' 
      };
    }

    return { allowed: false, reason: 'Неизвестный тип смены' };
  }

  /**
   * Получает локализованное название статуса
   */
  static getStatusLabel(status: ModelStatus): string {
    return StatusLabels[status] || status;
  }
}
