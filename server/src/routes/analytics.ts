import { Router } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { analyticsDb } from '../db/database';

const router = Router();

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const stats = AnalyticsService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

// Get conversion statistics
router.get('/conversion', async (req, res) => {
  try {
    const stats = AnalyticsService.getConversionStats();
    res.json(stats);
  } catch (error) {
    console.error('Conversion stats error:', error);
    res.status(500).json({ error: 'Ошибка получения статистики конверсии' });
  }
});

// Get status analytics
router.get('/status', async (req, res) => {
  try {
    const analytics = AnalyticsService.getStatusAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error('Status analytics error:', error);
    res.status(500).json({ error: 'Ошибка получения аналитики статусов' });
  }
});

// Get period analytics
router.get('/period', async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    if (!dateFrom || !dateTo) {
      return res.status(400).json({ error: 'Необходимо указать период (dateFrom, dateTo)' });
    }
    
    const analytics = AnalyticsService.getPeriodAnalytics(
      dateFrom as string,
      dateTo as string
    );
    
    res.json(analytics);
  } catch (error) {
    console.error('Period analytics error:', error);
    res.status(500).json({ error: 'Ошибка получения аналитики за период' });
  }
});

// Update leads count (root only)
router.put('/leads', async (req, res) => {
  try {
    const { count, username } = req.body;
    
    if (!count || typeof count !== 'number' || count < 0) {
      return res.status(400).json({ error: 'Некорректное количество лидов' });
    }
    
    // TODO: Add proper authentication middleware
    // For now, assume username is provided
    analyticsDb.updateLeadsCount(count, username || 'root');
    
    res.json({ success: true, count });
  } catch (error) {
    console.error('Update leads error:', error);
    res.status(500).json({ error: 'Ошибка обновления количества лидов' });
  }
});

// Get current leads count
router.get('/leads', async (req, res) => {
  try {
    const count = analyticsDb.getLeadsCount();
    res.json({ count });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Ошибка получения количества лидов' });
  }
});

// Get model lifecycle statistics
router.get('/lifecycle', async (req, res) => {
  try {
    const stats = AnalyticsService.getModelLifecycleStats();
    res.json(stats);
  } catch (error) {
    console.error('Model lifecycle stats error:', error);
    res.status(500).json({ error: 'Ошибка получения статистики жизненного цикла модели' });
  }
});

// Get earnings statistics
router.get('/earnings', async (req, res) => {
  try {
    const stats = AnalyticsService.getEarningsStats();
    res.json(stats);
  } catch (error) {
    console.error('Earnings stats error:', error);
    res.status(500).json({ error: 'Ошибка получения статистики заработка' });
  }
});

// Get employee conversion statistics
router.get('/employee-conversion', async (req, res) => {
  try {
    const stats = AnalyticsService.getEmployeeConversionStats();
    res.json(stats);
  } catch (error) {
    console.error('Employee conversion stats error:', error);
    res.status(500).json({ error: 'Ошибка получения статистики конверсии по сотрудникам' });
  }
});

export default router;
