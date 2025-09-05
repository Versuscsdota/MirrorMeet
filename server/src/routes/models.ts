import { Router } from 'express';
import { modelDb, auditDb, syncModelAndSlot } from '../db/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
// Resolve uploads directory from env or default to a system path
const DEFAULT_UPLOADS_DIR = path.resolve('/var/lib/mirrorcrm/uploads');
const UPLOADS_DIRECTORY = process.env.UPLOADS_DIR && process.env.UPLOADS_DIR.trim().length > 0
  ? process.env.UPLOADS_DIR
  : DEFAULT_UPLOADS_DIR;

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIRECTORY)) {
  fs.mkdirSync(UPLOADS_DIRECTORY, { recursive: true });
}

const createFileStorage = (): multer.StorageEngine => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOADS_DIRECTORY);
    },
    filename: (req, file, cb) => {
      const fileExtension = path.extname(file.originalname);
      const uniqueFilename = `${uuidv4()}${fileExtension}`;
      cb(null, uniqueFilename);
    }
  });
};

const fileUploadMiddleware = multer({
  storage: createFileStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
});

const createAuditLogEntry = (action: string, entityId: string, userId: string, details: any, req: AuthRequest) => {
  return auditDb.create({
    action,
    entityType: 'model',
    entityId,
    userId,
    details,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
};

const handleServerError = (res: any, message: string) => {
  res.status(500).json({ error: message });
};

const handleNotFound = (res: any, message: string) => {
  res.status(404).json({ error: message });
};

router.get('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const allModels = modelDb.getAll();
    res.json(allModels);
  } catch (error) {
    handleServerError(res, 'Failed to fetch models');
  }
});

router.get('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const modelId = req.params.id;
    const foundModel = modelDb.getById(modelId);
    
    if (!foundModel) {
      return handleNotFound(res, 'Model not found');
    }
    
    res.json(foundModel);
  } catch (error) {
    handleServerError(res, 'Failed to fetch model');
  }
});

router.post('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const newModel = modelDb.create(req.body);
    
    createAuditLogEntry('model_create', newModel.id, req.user!.id, req.body, req);
    
    res.status(201).json(newModel);
  } catch (error) {
    handleServerError(res, 'Failed to create model');
  }
});

router.put('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const modelId = req.params.id;
    const updatedModel = modelDb.update(modelId, req.body);
    
    if (!updatedModel) {
      return handleNotFound(res, 'Model not found');
    }
    
    createAuditLogEntry('model_update', updatedModel.id, req.user!.id, req.body, req);
    
    res.json(updatedModel);
  } catch (error) {
    handleServerError(res, 'Failed to update model');
  }
});

router.delete('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const modelId = req.params.id;
    const deletionSuccessful = modelDb.delete(modelId);
    
    if (!deletionSuccessful) {
      return handleNotFound(res, 'Model not found');
    }
    
    createAuditLogEntry('model_delete', modelId, req.user!.id, null, req);
    
    res.status(204).send();
  } catch (error) {
    handleServerError(res, 'Failed to delete model');
  }
});

const processUploadedFiles = (uploadedFiles: Express.Multer.File[]): string[] => {
  return uploadedFiles.map(file => `/uploads/${file.filename}`);
};

router.post('/:id/files', authenticateToken, fileUploadMiddleware.array('files'), (req: AuthRequest, res) => {
  try {
    const modelId = req.params.id;
    const existingModel = modelDb.getById(modelId);
    
    if (!existingModel) {
      return handleNotFound(res, 'Model not found');
    }
    
    const uploadedFiles = req.files as Express.Multer.File[];
    const newFilePaths = processUploadedFiles(uploadedFiles);
    const allFiles = [...(existingModel.files || []), ...newFilePaths];
    
    const updatedModel = modelDb.update(modelId, { files: allFiles });
    
    createAuditLogEntry('model_files_upload', modelId, req.user!.id, { files: newFilePaths }, req);
    
    res.json(updatedModel);
  } catch (error) {
    handleServerError(res, 'Failed to upload files');
  }
});

router.post('/:modelId/sync/:slotId', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { modelId, slotId } = req.params;
    
    syncModelAndSlot(modelId, slotId);
    
    createAuditLogEntry('model_slot_sync', modelId, req.user!.id, { slotId }, req);
    
    res.json({ success: true });
  } catch (error) {
    handleServerError(res, 'Failed to sync model and slot');
  }
});

export default router;
