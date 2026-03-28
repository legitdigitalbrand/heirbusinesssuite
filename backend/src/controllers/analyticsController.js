import { analyticsService } from '../services/analyticsService.js';

class AnalyticsController {
  /**
   * GET /api/analytics/dashboard-kpis
   * Get high-level KPIs for dashboard
   */
  async getDashboardKPIs(req, res) {
    try {
      const { company_id } = req.user;
      const { dateRange = 'month' } = req.query;

      const kpis = await analyticsService.getDashboardKPIs(company_id, dateRange);
      
      res.json({
        success: true,
        data: kpis
      });
    } catch (error) {
      console.error('Get dashboard KPIs error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard KPIs'
      });
    }
  }

  /**
   * GET /api/analytics/overview
   * Get company overview with all module counts
   */
  async getCompanyOverview(req, res) {
    try {
      const { company_id } = req.user;

      const overview = await analyticsService.getCompanyOverview(company_id);
      
      res.json({
        success: true,
        data: overview
      });
    } catch (error) {
      console.error('Get company overview error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch company overview'
      });
    }
  }

  /**
   * GET /api/analytics/executive-summary
   * Get executive summary with key metrics
   */
  async getExecutiveSummary(req, res) {
    try {
      const { company_id } = req.user;
      const { days = 30 } = req.query;

      const summary = await analyticsService.getExecutiveSummary(company_id, parseInt(days));
      
      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Get executive summary error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch executive summary'
      });
    }
  }

  /**
   * COMMUNICATION ANALYTICS
   */
  async getMessageStats(req, res) {
    try {
      const { company_id } = req.user;
      const { startDate, endDate, dateRange = 'month' } = req.query;

      let start = startDate;
      let end = endDate;

      if (!start || !end) {
        const range = analyticsService.getDateRange(dateRange);
        start = range.startDate;
        end = range.endDate;
      }

      const stats = await analyticsService.getMessageStats(company_id, start, end);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get message stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch message statistics'
      });
    }
  }

  /**
   * GET /api/analytics/channel-engagement
   * Most active channels
   */
  async getChannelEngagement(req, res) {
    try {
      const { company_id } = req.user;
      const { limit = 10 } = req.query;

      const engagement = await analyticsService.getChannelEngagement(company_id, parseInt(limit));
      
      res.json({
        success: true,
        data: engagement
      });
    } catch (error) {
      console.error('Get channel engagement error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch channel engagement data'
      });
    }
  }

  /**
   * GET /api/analytics/user-activity
   * Top active users in communication
   */
  async getUserActivity(req, res) {
    try {
      const { company_id } = req.user;
      const { startDate, endDate, limit = 20, dateRange = 'month' } = req.query;

      let start = startDate;
      let end = endDate;

      if (!start || !end) {
        const range = analyticsService.getDateRange(dateRange);
        start = range.startDate;
        end = range.endDate;
      }

      const activity = await analyticsService.getUserActivityStats(company_id, start, end, parseInt(limit));
      
      res.json({
        success: true,
        data: activity
      });
    } catch (error) {
      console.error('Get user activity error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user activity data'
      });
    }
  }

  /**
   * GET /api/analytics/message-trend
   * Message volume over time
   */
  async getMessageTrend(req, res) {
    try {
      const { company_id } = req.user;
      const { days = 30 } = req.query;

      const trend = await analyticsService.getMessageTimeSeries(company_id, parseInt(days));
      
      res.json({
        success: true,
        data: trend
      });
    } catch (error) {
      console.error('Get message trend error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch message trend data'
      });
    }
  }

  /**
   * INVENTORY ANALYTICS
   */
  async getInventoryStats(req, res) {
    try {
      const { company_id } = req.user;

      const stats = await analyticsService.getInventoryStats(company_id);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get inventory stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch inventory statistics'
      });
    }
  }

  /**
   * GET /api/analytics/inventory-movement
   * Product stock movement and trending
   */
  async getInventoryMovement(req, res) {
    try {
      const { company_id } = req.user;
      const { days = 30, limit = 10 } = req.query;

      const movement = await analyticsService.getInventoryMovement(
        company_id,
        parseInt(days),
        parseInt(limit)
      );
      
      res.json({
        success: true,
        data: movement
      });
    } catch (error) {
      console.error('Get inventory movement error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch inventory movement data'
      });
    }
  }

  /**
   * GET /api/analytics/inventory-trend
   * Inventory transaction trend over time
   */
  async getInventoryTrend(req, res) {
    try {
      const { company_id } = req.user;
      const { days = 30 } = req.query;

      const trend = await analyticsService.getInventoryTrend(company_id, parseInt(days));
      
      res.json({
        success: true,
        data: trend
      });
    } catch (error) {
      console.error('Get inventory trend error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch inventory trend data'
      });
    }
  }

  /**
   * EMPLOYEE & ATTENDANCE ANALYTICS
   */
  async getAttendanceStats(req, res) {
    try {
      const { company_id } = req.user;
      const { startDate, endDate, dateRange = 'month' } = req.query;

      let start = startDate;
      let end = endDate;

      if (!start || !end) {
        const range = analyticsService.getDateRange(dateRange);
        start = range.startDate;
        end = range.endDate;
      }

      const stats = await analyticsService.getAttendanceStats(company_id, start, end);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get attendance stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch attendance statistics'
      });
    }
  }

  /**
   * GET /api/analytics/attendance-trend
   * Attendance pattern over time
   */
  async getAttendanceTrend(req, res) {
    try {
      const { company_id } = req.user;
      const { days = 30 } = req.query;

      const trend = await analyticsService.getAttendanceTrend(company_id, parseInt(days));
      
      res.json({
        success: true,
        data: trend
      });
    } catch (error) {
      console.error('Get attendance trend error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch attendance trend data'
      });
    }
  }

  /**
   * GET /api/analytics/employee-stats
   * Employee distribution by role and status
   */
  async getEmployeeStats(req, res) {
    try {
      const { company_id } = req.user;

      const stats = await analyticsService.getEmployeeStats(company_id);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get employee stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch employee statistics'
      });
    }
  }

  /**
   * GET /api/analytics/department-performance
   * Performance metrics by department
   */
  async getDepartmentPerformance(req, res) {
    try {
      const { company_id } = req.user;

      const performance = await analyticsService.getDepartmentPerformance(company_id);
      
      res.json({
        success: true,
        data: performance
      });
    } catch (error) {
      console.error('Get department performance error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch department performance data'
      });
    }
  }

  /**
   * GET /api/analytics/report
   * Generate comprehensive report
   * Query params: reportType (full|communication|inventory|attendance|department), days
   */
  async generateReport(req, res) {
    try {
      const { company_id } = req.user;
      const { reportType = 'full', days = 30 } = req.query;

      const { startDate, endDate } = analyticsService.getDateRange('custom', parseInt(days));

      const report = await analyticsService.exportAnalyticsReport(
        company_id,
        reportType,
        startDate,
        endDate
      );
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Generate report error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate report'
      });
    }
  }

  /**
   * GET /api/analytics/export
   * Export report as CSV/JSON
   */
  async exportReport(req, res) {
    try {
      const { company_id } = req.user;
      const { reportType = 'full', format = 'json', days = 30 } = req.query;

      const { startDate, endDate } = analyticsService.getDateRange('custom', parseInt(days));

      const report = await analyticsService.exportAnalyticsReport(
        company_id,
        reportType,
        startDate,
        endDate
      );

      if (format === 'csv') {
        // Convert to CSV format
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-${reportType}-${new Date().getTime()}.csv"`);
        res.send(this.convertToCSV(report));
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-${reportType}-${new Date().getTime()}.json"`);
        res.json(report);
      }
    } catch (error) {
      console.error('Export report error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export report'
      });
    }
  }

  /**
   * HELPER: Convert object to CSV
   */
  convertToCSV(obj) {
    const flatObj = this.flattenObject(obj);
    const headers = Object.keys(flatObj);
    const csv = [
      headers.join(','),
      headers.map(h => flatObj[h]).join(',')
    ];
    return csv.join('\n');
  }

  /**
   * HELPER: Flatten nested object
   */
  flattenObject(obj, prefix = '', result = {}) {
    for (const key in obj) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value === null || value === undefined) {
        result[newKey] = '';
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        this.flattenObject(value, newKey, result);
      } else if (Array.isArray(value)) {
        result[newKey] = JSON.stringify(value);
      } else {
        result[newKey] = value;
      }
    }
    return result;
  }
}

export const analyticsController = new AnalyticsController();
