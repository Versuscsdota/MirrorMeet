import { Router } from 'express';
import { shiftDb, auditDb, modelDb } from '../db/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { ModelStatus, Model, Shift } from '../types';
import { logger, logModelStatusChange, logShiftCompletion, logError } from '../utils/logger';

const router = Router();

// Get all shifts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const shifts = shiftDb.getAll();
    res.json({ items: shifts });
  } catch (error) {
    console.error('Failed to get shifts:', error);
    res.status(500).json({ error: 'Failed to get shifts' });
  }
});

// Get shift by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const shift = shiftDb.getById(req.params.id);
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    res.json(shift);
  } catch (error) {
    console.error('Failed to get shift:', error);
    res.status(500).json({ error: 'Failed to get shift' });
  }
});

// Create new shift
router.post('/', authenticateToken, async (req, res) => {
  try {
    const shiftData = req.body;
    const shift = shiftDb.create(shiftData);
    
    // Log the creation
    auditDb.create({
      action: 'Создана смена',
      entityType: 'shift',
      entityId: shift.id,
      userId: (req as AuthRequest).user?.id || '',
      details: { 
        model: shift.model, 
        type: shift.type, 
        status: shift.status,
        hasRegistrationData: !!(shift.birthDate || shift.documentType || shift.internshipDate || shift.photo || shift.audio)
      },
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(201).json(shift);
  } catch (error) {
    console.error('Failed to create shift:', error);
    res.status(500).json({ error: 'Failed to create shift' });
  }
});

// Update shift
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const shiftId = req.params.id;
    const updates = req.body;
    
    const originalShift = shiftDb.getById(shiftId);
    if (!originalShift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    
    const updatedShift = shiftDb.update(shiftId, updates);
    if (!updatedShift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    
    // Автоматическое изменение статуса модели после завершения смен
    if (updates.status === 'completed') {
      try {
        // Ищем модель по имени или ID
        let model = null;
        if (originalShift.modelId) {
          model = modelDb.getById(originalShift.modelId);
        }
        
        // Если не найдена по ID, ищем по имени
        if (!model && originalShift.model) {
          const allModels = modelDb.getAll();
          model = allModels.find((m: Model) => m.name === originalShift.model);
        }
        
        if (model) {
          const userId = (req as AuthRequest).user?.id || '';
          
          if (originalShift.type === 'training') {
            // Логика для стажировочных смен
            if (model.status === ModelStatus.REGISTERED || model.status === ModelStatus.ACCOUNT_REGISTERED) {
              const oldStatus = model.status;
              modelDb.update(model.id, { status: ModelStatus.TRAINING });
              
              logModelStatusChange(model.id, oldStatus, ModelStatus.TRAINING, 'first_training_completed', userId);
              logShiftCompletion(shiftId, model.id, 'training', userId);
              
              auditDb.create({
                action: 'Статус модели изменен на "Стажировка" после завершения первой стажировочной смены',
                entityType: 'model',
                entityId: model.id,
                userId,
                details: { oldStatus, newStatus: ModelStatus.TRAINING, reason: 'first_training_completed' },
                ip: req.ip,
                userAgent: req.get('User-Agent')
              });
            } else if (model.status === ModelStatus.TRAINING) {
              // Проверяем количество завершенных стажировочных смен
              const allShifts = shiftDb.getAll();
              const completedTrainingShifts = allShifts.filter(
                shift => 
                (shift.modelId === model.id || shift.model === model.name) &&
                shift.type === 'training' &&
                shift.status === 'completed'
              );
              
              if (completedTrainingShifts.length >= 2) {
                const oldStatus = model.status;
                modelDb.update(model.id, { status: ModelStatus.READY_TO_WORK });
                
                logModelStatusChange(model.id, oldStatus, ModelStatus.READY_TO_WORK, 'second_training_completed', userId);
                
                auditDb.create({
                  action: 'Статус модели изменен на "Готова к работе" после завершения второй стажировочной смены',
                  entityType: 'model',
                  entityId: model.id,
                  userId,
                  details: { oldStatus, newStatus: ModelStatus.READY_TO_WORK, reason: 'second_training_completed' },
                  ip: req.ip,
                  userAgent: req.get('User-Agent')
                });
              }
            }
          } else if (originalShift.type === 'regular') {
            // Логика для обычных смен
            if (model.status === ModelStatus.READY_TO_WORK) {
              const oldStatus = model.status;
              modelDb.update(model.id, { status: ModelStatus.MODEL });
              
              logModelStatusChange(model.id, oldStatus, ModelStatus.MODEL, 'first_regular_shift_completed', userId);
              logShiftCompletion(shiftId, model.id, 'regular', userId);
              
              auditDb.create({
                action: 'Статус модели изменен на "Модель" после завершения первой рабочей смены',
                entityType: 'model',
                entityId: model.id,
                userId,
                details: { oldStatus, newStatus: ModelStatus.MODEL, reason: 'first_regular_shift_completed' },
                ip: req.ip,
                userAgent: req.get('User-Agent')
              });
            }
          }
        }
      } catch (modelUpdateError) {
        logError(modelUpdateError as Error, 'model_status_update', (req as AuthRequest).user?.id);
      }
    }
    
    // Log the update
    const changes = Object.keys(updates).map(key => {
      const oldValue = (originalShift as unknown as Record<string, unknown>)[key];
      const newValue = updates[key];
      return `${key}: ${oldValue} → ${newValue}`;
    }).join(', ');
    
    auditDb.create({
      action: `Обновлена смена: ${changes}`,
      entityType: 'shift',
      entityId: shiftId,
      userId: (req as AuthRequest).user?.id || '',
      details: { changes: updates },
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json(updatedShift);
  } catch (error) {
    console.error('Failed to update shift:', error);
    res.status(500).json({ error: 'Failed to update shift' });
  }
});

// Delete shift
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const shiftId = req.params.id;
    const shift = shiftDb.getById(shiftId);
    
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    
    const deleted = shiftDb.delete(shiftId);
    if (!deleted) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    
    // Log the deletion
    auditDb.create({
      action: 'Удалена смена',
      entityType: 'shift',
      entityId: shiftId,
      userId: (req as AuthRequest).user?.id || '',
      details: { model: shift.model, type: shift.type },
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete shift:', error);
    res.status(500).json({ error: 'Failed to delete shift' });
  }
});

export default router;
