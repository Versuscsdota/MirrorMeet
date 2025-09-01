// Unified status system for slots and models

const STATUS_DEFINITIONS = {
  status1: {
    values: ['confirmed', 'not_confirmed', 'fail'],
    default: 'not_confirmed',
    labels: {
      confirmed: 'Подтвердилось',
      not_confirmed: 'Не подтвердилось', 
      fail: 'Слив'
    }
  },
  status2: {
    values: ['arrived', 'no_show', 'other'],
    default: undefined,
    labels: {
      arrived: 'Пришла',
      no_show: 'Не пришла',
      other: 'Другое'
    }
  },
  status3: {
    values: ['thinking', 'reject_us', 'reject_candidate'],
    default: undefined,
    labels: {
      thinking: 'Думает',
      reject_us: 'Отказ с нашей',
      reject_candidate: 'Отказ кандидата'
    }
  },
  status4: {
    values: ['registration'],
    default: undefined,
    labels: {
      registration: 'Регистрация'
    }
  }
};

// Normalize status values with validation
export function normalizeStatuses(obj) {
  const result = { ...obj };
  
  // status1 is required, others optional
  result.status1 = STATUS_DEFINITIONS.status1.values.includes(obj.status1) 
    ? obj.status1 
    : STATUS_DEFINITIONS.status1.default;
    
  result.status2 = (obj.status2 && STATUS_DEFINITIONS.status2.values.includes(obj.status2)) 
    ? obj.status2 
    : undefined;
    
  result.status3 = (obj.status3 && STATUS_DEFINITIONS.status3.values.includes(obj.status3)) 
    ? obj.status3 
    : undefined;
  
  result.status4 = (obj.status4 && STATUS_DEFINITIONS.status4.values.includes(obj.status4))
    ? obj.status4
    : undefined;
    
  return result;
}

// Validate individual status
export function validateStatus(statusKey, value) {
  const def = STATUS_DEFINITIONS[statusKey];
  if (!def) return false;
  
  if (statusKey === 'status1') {
    return def.values.includes(value);
  }
  
  return !value || def.values.includes(value);
}

// Create status change history entry
export function createStatusChangeEntry(userId, oldStatuses, newStatuses) {
  return {
    ts: Date.now(),
    userId,
    action: 'status_change',
    status1: newStatuses.status1,
    status2: newStatuses.status2,
    status3: newStatuses.status3,
    status4: newStatuses.status4,
    changes: {
      ...(oldStatuses.status1 !== newStatuses.status1 ? { status1: { from: oldStatuses.status1, to: newStatuses.status1 } } : {}),
      ...(oldStatuses.status2 !== newStatuses.status2 ? { status2: { from: oldStatuses.status2, to: newStatuses.status2 } } : {}),
      ...(oldStatuses.status3 !== newStatuses.status3 ? { status3: { from: oldStatuses.status3, to: newStatuses.status3 } } : {}),
      ...(oldStatuses.status4 !== newStatuses.status4 ? { status4: { from: oldStatuses.status4, to: newStatuses.status4 } } : {})
    }
  };
}

// Sync statuses between slot and model
export async function syncSlotModelStatuses(env, slotId, slotDate, modelId, newStatuses) {
  if (!modelId) return;
  
  try {
    // Update model statuses
    const model = await env.CRM_KV.get(`model:${modelId}`, { type: 'json' });
    if (model) {
      const oldStatuses = { status1: model.status1, status2: model.status2, status3: model.status3, status4: model.status4 };
      const normalizedStatuses = normalizeStatuses(newStatuses);
      
      model.status1 = normalizedStatuses.status1;
      model.status2 = normalizedStatuses.status2;
      model.status3 = normalizedStatuses.status3;
      model.status4 = normalizedStatuses.status4;
      
      // Add history entry for status sync
      model.history = model.history || [];
      model.history.push({
        ts: Date.now(),
        type: 'status_sync_from_slot',
        slot: { id: slotId, date: slotDate },
        statuses: normalizedStatuses,
        changes: createStatusChangeEntry(null, oldStatuses, normalizedStatuses).changes
      });
      
      await env.CRM_KV.put(`model:${modelId}`, JSON.stringify(model));
    }
  } catch (e) {
    console.warn('Failed to sync slot->model statuses:', e);
  }
}
