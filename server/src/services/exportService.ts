import * as ExcelJS from 'exceljs';
import { modelDb, slotDb } from '../db/database';
import { Model, Slot, ModelStatus } from '../types';

export interface ExportFilters {
  status?: ModelStatus;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
}

export class ExportService {
  
  // Export models to Excel/CSV
  static async exportModels(filters: ExportFilters = {}, format: 'xlsx' | 'csv' = 'xlsx'): Promise<Buffer> {
    let models = modelDb.getAll();
    
    // Apply filters
    if (filters.status) {
      models = models.filter(m => m.status === filters.status);
    }
    
    if (filters.dateFrom) {
      models = models.filter(m => new Date(m.createdAt) >= new Date(filters.dateFrom!));
    }
    
    if (filters.dateTo) {
      const endDate = new Date(filters.dateTo);
      endDate.setHours(23, 59, 59, 999);
      models = models.filter(m => new Date(m.createdAt) <= endDate);
    }
    
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      models = models.filter(m => 
        m.fullName?.toLowerCase().includes(query) ||
        m.phone?.toLowerCase().includes(query) ||
        m.email?.toLowerCase().includes(query)
      );
    }
    
    // Prepare data for export
    const exportData = models.map(model => ({
      'ФИО': model.fullName || model.name,
      'Телефон': model.phone,
      'Email': model.email,
      'Telegram': model.telegram,
      'Instagram': model.instagram,
      'Дата рождения': model.birthDate,
      'Тип документа': model.documentType,
      'Номер документа': model.documentNumber,
      'Дата стажировки': model.firstTrialDate,
      'Статус': this.getStatusLabel(model.status),
      'Заметки': model.notes,
      'Дата регистрации': new Date(model.createdAt).toLocaleDateString('ru-RU'),
      'Последнее обновление': new Date(model.updatedAt).toLocaleDateString('ru-RU')
    }));
    
    return await this.generateFile(exportData, 'Модели', format);
  }
  
  // Export slots schedule
  static async exportSlots(dateFrom?: string, dateTo?: string, format: 'xlsx' | 'csv' = 'xlsx'): Promise<Buffer> {
    let slots = slotDb.getAll();
    const models = modelDb.getAll();
    
    // Apply date filters
    if (dateFrom) {
      slots = slots.filter(s => s.date >= dateFrom);
    }
    
    if (dateTo) {
      slots = slots.filter(s => s.date <= dateTo);
    }
    
    // Prepare data for export
    const exportData = slots.map(slot => {
      const linkedModel = models.find(m => m.id === slot.modelId);
      
      return {
        'Дата': new Date(slot.date).toLocaleDateString('ru-RU'),
        'Время': slot.time,
        'ФИО клиента': slot.clientName || linkedModel?.fullName || linkedModel?.name || 'Не указано',
        'Телефон': slot.clientPhone || linkedModel?.phone || 'Не указан',
        'Статус слота': this.getStatusLabel(slot.status),
        'Статус 1': slot.status1 || '',
        'Статус 2': slot.status2 || '',
        'Посещение': slot.visitStatus || '',
        'Заметки': slot.notes || '',
        'Связанная модель': linkedModel ? 'Да' : 'Нет',
        'Дата создания': new Date(slot.createdAt).toLocaleDateString('ru-RU')
      };
    });
    
    return await this.generateFile(exportData, 'Расписание_слотов', format);
  }
  
  // Generate period report
  static async exportPeriodReport(dateFrom: string, dateTo: string, format: 'xlsx' | 'csv' = 'xlsx'): Promise<Buffer> {
    const models = modelDb.getAll().filter(m => {
      const createdAt = new Date(m.createdAt);
      return createdAt >= new Date(dateFrom) && createdAt <= new Date(dateTo);
    });
    
    const slots = slotDb.getAll().filter(s => {
      return s.date >= dateFrom && s.date <= dateTo;
    });
    
    // Calculate statistics
    const stats = this.calculatePeriodStats(models, slots);
    
    const reportData = [
      { 'Показатель': 'Общее количество моделей', 'Значение': models.length },
      { 'Показатель': 'Новых регистраций', 'Значение': models.filter(m => m.status === ModelStatus.REGISTERED).length },
      { 'Показатель': 'Подтвержденных', 'Значение': models.filter(m => m.status === ModelStatus.CONFIRMED).length },
      { 'Показатель': 'Слитых', 'Значение': models.filter(m => m.status === ModelStatus.DRAINED).length },
      { 'Показатель': 'Отказов кандидатов', 'Значение': models.filter(m => m.status === ModelStatus.CANDIDATE_REFUSED).length },
      { 'Показатель': 'Наших отказов', 'Значение': models.filter(m => m.status === ModelStatus.OUR_REFUSAL).length },
      { 'Показатель': 'Думающих', 'Значение': models.filter(m => m.status === ModelStatus.THINKING).length },
      { 'Показатель': 'Пришедших', 'Значение': models.filter(m => m.status === ModelStatus.ARRIVED).length },
      { 'Показатель': 'Не пришедших', 'Значение': models.filter(m => m.status === ModelStatus.NO_SHOW).length },
      { 'Показатель': '', 'Значение': '' },
      { 'Показатель': 'Общее количество слотов', 'Значение': slots.length },
      { 'Показатель': 'Занятых слотов', 'Значение': slots.filter(s => s.clientName || s.modelId).length },
      { 'Показатель': 'Конверсия в регистрацию', 'Значение': `${stats.conversionRate}%` },
      { 'Показатель': 'Средняя загрузка в день', 'Значение': stats.avgSlotsPerDay }
    ];
    
    return await this.generateFile(reportData, `Отчет_${dateFrom}_${dateTo}`, format);
  }
  
  private static calculatePeriodStats(models: Model[], slots: Slot[]) {
    const totalSlots = slots.length;
    const occupiedSlots = slots.filter(s => s.clientName || s.modelId).length;
    const registeredModels = models.filter(m => m.status === ModelStatus.REGISTERED).length;
    
    const conversionRate = occupiedSlots > 0 ? Math.round((registeredModels / occupiedSlots) * 100) : 0;
    
    // Calculate average slots per day
    const dates = [...new Set(slots.map(s => s.date))];
    const avgSlotsPerDay = dates.length > 0 ? Math.round(totalSlots / dates.length) : 0;
    
    return {
      conversionRate,
      avgSlotsPerDay
    };
  }
  
  private static async generateFile(data: any[], sheetName: string, format: 'xlsx' | 'csv'): Promise<Buffer> {
    if (format === 'csv') {
      // Generate CSV manually
      if (data.length === 0) return Buffer.from('', 'utf-8');
      
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
          const value = row[header] || '';
          // Escape commas and quotes in CSV
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(','))
      ];
      
      return Buffer.from(csvRows.join('\n'), 'utf-8');
    } else {
      // Generate Excel file with ExcelJS
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheetName);
      
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        worksheet.addRow(headers);
        
        data.forEach(row => {
          const rowData = headers.map(header => row[header] || '');
          worksheet.addRow(rowData);
        });
        
        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      }
      
      return Buffer.from(await workbook.xlsx.writeBuffer());
    }
  }
  
  private static getStatusLabel(status: ModelStatus): string {
    const labels: Record<ModelStatus, string> = {
      [ModelStatus.NOT_CONFIRMED]: 'Не подтверждена',
      [ModelStatus.CONFIRMED]: 'Подтверждена',
      [ModelStatus.DRAINED]: 'Слита',
      [ModelStatus.CANDIDATE_REFUSED]: 'Отказ кандидата',
      [ModelStatus.ACCOUNT_REGISTERED]: 'Зарегистрирована',
      [ModelStatus.OUR_REFUSAL]: 'Наш отказ',
      [ModelStatus.THINKING]: 'Думает',
      [ModelStatus.REGISTERED]: 'Зарегистрирована',
      [ModelStatus.NO_SHOW]: 'Не пришла',
      [ModelStatus.ARRIVED]: 'Пришла',
      [ModelStatus.TRAINING]: 'Стажировка',
      [ModelStatus.READY_TO_WORK]: 'Готова к работе',
      [ModelStatus.MODEL]: 'Модель',
      [ModelStatus.CLOSED_TO_TEAM]: 'Закрыта для команды',
      [ModelStatus.INACTIVE]: 'Неактивна'
    };
    
    return labels[status] || status;
  }
}
