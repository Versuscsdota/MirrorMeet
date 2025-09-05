import { Router } from 'express';
import { ExportService, ExportFilters } from '../services/exportService';
import { ModelStatus } from '../types';

const router = Router();

// Export models
router.get('/models', async (req, res) => {
  try {
    const { status, dateFrom, dateTo, searchQuery, format = 'xlsx', download } = req.query as any;
    
    const filters: ExportFilters = {};
    
    if (status && Object.values(ModelStatus).includes(status as ModelStatus)) {
      filters.status = status as ModelStatus;
    }
    
    if (dateFrom && typeof dateFrom === 'string') {
      filters.dateFrom = dateFrom;
    }
    
    if (dateTo && typeof dateTo === 'string') {
      filters.dateTo = dateTo;
    }
    
    if (searchQuery && typeof searchQuery === 'string') {
      filters.searchQuery = searchQuery;
    }
    
    const exportFormat: 'xlsx' | 'csv' = format === 'csv' ? 'csv' : 'xlsx';
    if (download === '1' || download === 'true') {
      const file = await ExportService.exportModelsToFile(filters, exportFormat);
      return res.download(file.path, file.filename);
    } else {
      const buffer = await ExportService.exportModels(filters, exportFormat);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `models_${timestamp}.${exportFormat}`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', exportFormat === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(buffer);
    }
  } catch (error) {
    console.error('Export models error:', error);
    res.status(500).json({ error: 'Ошибка экспорта моделей' });
  }
});

// Export slots schedule
router.get('/slots', async (req, res) => {
  try {
    const { dateFrom, dateTo, format = 'xlsx', download } = req.query as any;
    const exportFormat: 'xlsx' | 'csv' = format === 'csv' ? 'csv' : 'xlsx';
    if (download === '1' || download === 'true') {
      const file = await ExportService.exportSlotsToFile(dateFrom as string, dateTo as string, exportFormat);
      return res.download(file.path, file.filename);
    } else {
      const buffer = await ExportService.exportSlots(dateFrom as string, dateTo as string, exportFormat);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `slots_${timestamp}.${exportFormat}`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', exportFormat === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(buffer);
    }
  } catch (error) {
    console.error('Export slots error:', error);
    res.status(500).json({ error: 'Ошибка экспорта слотов' });
  }
});

// Export period report
router.get('/report', async (req, res) => {
  try {
    const { dateFrom, dateTo, format = 'xlsx', download } = req.query as any;
    
    if (!dateFrom || !dateTo) {
      return res.status(400).json({ error: 'Необходимо указать период (dateFrom, dateTo)' });
    }
    
    const exportFormat: 'xlsx' | 'csv' = format === 'csv' ? 'csv' : 'xlsx';
    if (download === '1' || download === 'true') {
      const file = await ExportService.exportPeriodReportToFile(dateFrom as string, dateTo as string, exportFormat);
      return res.download(file.path, file.filename);
    } else {
      const buffer = await ExportService.exportPeriodReport(dateFrom as string, dateTo as string, exportFormat);
      const filename = `report_${dateFrom}_${dateTo}.${exportFormat}`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', exportFormat === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(buffer);
    }
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ error: 'Ошибка создания отчета' });
  }
});

export default router;
