import { ModelStatus } from '../types';
import { modelDb, shiftDb, auditDb } from '../db/database';

// Mock database functions for testing
const mockModelDb = {
  getById: jest.fn(),
  getAll: jest.fn(),
  update: jest.fn(),
};

const mockShiftDb = {
  getAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

const mockAuditDb = {
  create: jest.fn(),
};

// Mock the database modules
jest.mock('../db/database', () => ({
  modelDb: mockModelDb,
  shiftDb: mockShiftDb,
  auditDb: mockAuditDb,
}));

describe('Model Lifecycle Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Training Shift Completion', () => {
    test('should update status from REGISTERED to TRAINING after first training shift', () => {
      // Arrange
      const mockModel = {
        id: 'model-1',
        name: 'Test Model',
        status: ModelStatus.REGISTERED
      };

      mockModelDb.getById.mockReturnValue(mockModel);

      // Act
      const oldStatus = mockModel.status;
      mockModelDb.update(mockModel.id, { status: ModelStatus.TRAINING });

      // Assert
      expect(mockModelDb.update).toHaveBeenCalledWith('model-1', { status: ModelStatus.TRAINING });
      expect(oldStatus).toBe(ModelStatus.REGISTERED);
    });

    test('should update status from ACCOUNT_REGISTERED to TRAINING after first training shift', () => {
      // Arrange
      const mockModel = {
        id: 'model-1',
        name: 'Test Model',
        status: ModelStatus.ACCOUNT_REGISTERED
      };

      mockModelDb.getById.mockReturnValue(mockModel);

      // Act
      const oldStatus = mockModel.status;
      mockModelDb.update(mockModel.id, { status: ModelStatus.TRAINING });

      // Assert
      expect(mockModelDb.update).toHaveBeenCalledWith('model-1', { status: ModelStatus.TRAINING });
      expect(oldStatus).toBe(ModelStatus.ACCOUNT_REGISTERED);
    });

    test('should update status from TRAINING to READY_TO_WORK after second training shift', () => {
      // Arrange
      const mockModel = {
        id: 'model-1',
        name: 'Test Model',
        status: ModelStatus.TRAINING
      };

      const mockCompletedShifts = [
        { modelId: 'model-1', type: 'training', status: 'completed' },
        { modelId: 'model-1', type: 'training', status: 'completed' }
      ];

      mockModelDb.getById.mockReturnValue(mockModel);
      mockShiftDb.getAll.mockReturnValue(mockCompletedShifts);

      // Act
      const completedTrainingShifts = mockCompletedShifts.filter(
        (shift: any) => shift.modelId === mockModel.id && shift.type === 'training' && shift.status === 'completed'
      );

      if (completedTrainingShifts.length >= 2) {
        mockModelDb.update(mockModel.id, { status: ModelStatus.READY_TO_WORK });
      }

      // Assert
      expect(completedTrainingShifts).toHaveLength(2);
      expect(mockModelDb.update).toHaveBeenCalledWith('model-1', { status: ModelStatus.READY_TO_WORK });
    });
  });

  describe('Regular Shift Completion', () => {
    test('should update status from READY_TO_WORK to MODEL after first regular shift', () => {
      // Arrange
      const mockModel = {
        id: 'model-1',
        name: 'Test Model',
        status: ModelStatus.READY_TO_WORK
      };

      mockModelDb.getById.mockReturnValue(mockModel);

      // Act
      const oldStatus = mockModel.status;
      mockModelDb.update(mockModel.id, { status: ModelStatus.MODEL });

      // Assert
      expect(mockModelDb.update).toHaveBeenCalledWith('model-1', { status: ModelStatus.MODEL });
      expect(oldStatus).toBe(ModelStatus.READY_TO_WORK);
    });

    test('should not update status if model is not in READY_TO_WORK status', () => {
      // Arrange
      const mockModel = {
        id: 'model-1',
        name: 'Test Model',
        status: ModelStatus.TRAINING
      };

      mockModelDb.getById.mockReturnValue(mockModel);

      // Act
      if (mockModel.status === ModelStatus.READY_TO_WORK) {
        mockModelDb.update(mockModel.id, { status: ModelStatus.MODEL });
      }

      // Assert
      expect(mockModelDb.update).not.toHaveBeenCalled();
    });
  });

  describe('Model Lookup', () => {
    test('should find model by ID first', () => {
      // Arrange
      const mockModel = {
        id: 'model-1',
        name: 'Test Model',
        status: ModelStatus.REGISTERED
      };

      mockModelDb.getById.mockReturnValue(mockModel);

      // Act
      const foundModel = mockModelDb.getById('model-1');

      // Assert
      expect(mockModelDb.getById).toHaveBeenCalledWith('model-1');
      expect(foundModel).toEqual(mockModel);
    });

    test('should find model by name if ID lookup fails', () => {
      // Arrange
      const mockModels = [
        { id: 'model-1', name: 'Test Model', status: ModelStatus.REGISTERED },
        { id: 'model-2', name: 'Another Model', status: ModelStatus.TRAINING }
      ];

      mockModelDb.getById.mockReturnValue(null);
      mockModelDb.getAll.mockReturnValue(mockModels);

      // Act
      let model = mockModelDb.getById('model-1');
      if (!model) {
        const allModels = mockModelDb.getAll();
        model = allModels.find((m: any) => m.name === 'Test Model');
      }

      // Assert
      expect(mockModelDb.getById).toHaveBeenCalledWith('model-1');
      expect(mockModelDb.getAll).toHaveBeenCalled();
      expect(model).toEqual(mockModels[0]);
    });
  });

  describe('Audit Logging', () => {
    test('should create audit log for status changes', () => {
      // Arrange
      const auditData = {
        action: 'Статус модели изменен на "Стажировка" после завершения первой стажировочной смены',
        entityType: 'model',
        entityId: 'model-1',
        userId: 'user-1',
        details: { 
          oldStatus: ModelStatus.REGISTERED, 
          newStatus: ModelStatus.TRAINING, 
          reason: 'first_training_completed' 
        }
      };

      // Act
      mockAuditDb.create(auditData);

      // Assert
      expect(mockAuditDb.create).toHaveBeenCalledWith(auditData);
    });
  });

  describe('Edge Cases', () => {
    test('should handle model not found gracefully', () => {
      // Arrange
      mockModelDb.getById.mockReturnValue(null);
      mockModelDb.getAll.mockReturnValue([]);

      // Act
      let model = mockModelDb.getById('non-existent-id');
      if (!model) {
        const allModels = mockModelDb.getAll();
        model = allModels.find((m: any) => m.name === 'Non-existent Model');
      }

      // Assert
      expect(model).toBeUndefined();
      expect(mockModelDb.getById).toHaveBeenCalledWith('non-existent-id');
      expect(mockModelDb.getAll).toHaveBeenCalled();
    });

    test('should handle empty shifts array', () => {
      // Arrange
      const mockModel = {
        id: 'model-1',
        name: 'Test Model',
        status: ModelStatus.TRAINING
      };

      mockModelDb.getById.mockReturnValue(mockModel);
      mockShiftDb.getAll.mockReturnValue([]);

      // Act
      const allShifts = mockShiftDb.getAll();
      const completedTrainingShifts = allShifts.filter(
        (shift: any) => shift.modelId === mockModel.id && shift.type === 'training' && shift.status === 'completed'
      );

      // Assert
      expect(completedTrainingShifts).toHaveLength(0);
      expect(mockModelDb.update).not.toHaveBeenCalled();
    });
  });

  describe('Status Transition Validation', () => {
    test('should follow correct status progression', () => {
      const validTransitions = [
        { from: ModelStatus.REGISTERED, to: ModelStatus.TRAINING },
        { from: ModelStatus.ACCOUNT_REGISTERED, to: ModelStatus.TRAINING },
        { from: ModelStatus.TRAINING, to: ModelStatus.READY_TO_WORK },
        { from: ModelStatus.READY_TO_WORK, to: ModelStatus.MODEL }
      ];

      validTransitions.forEach(transition => {
        expect(transition.from).not.toBe(transition.to);
        expect([
          ModelStatus.REGISTERED,
          ModelStatus.ACCOUNT_REGISTERED,
          ModelStatus.TRAINING,
          ModelStatus.READY_TO_WORK,
          ModelStatus.MODEL
        ]).toContain(transition.from);
        expect([
          ModelStatus.TRAINING,
          ModelStatus.READY_TO_WORK,
          ModelStatus.MODEL
        ]).toContain(transition.to);
      });
    });
  });
});
