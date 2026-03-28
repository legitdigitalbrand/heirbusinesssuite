import { pool } from '../config/database.js';

class AnalyticsService {
  /**
   * DASHBOARD KPIs
   */
  async getDashboardKPIs(companyId, dateRange = 'month') {
    try {
      const { startDate, endDate } = this.getDateRange(dateRange);
      
      // Parallel queries for all KPIs
      const [
        messageStats,
        inventoryStats,
        attendanceStats,
        employeeStats
      ] = await Promise.all([
        this.getMessageStats(companyId, startDate, endDate),
        this.getInventoryStats(companyId),
        this.getAttendanceStats(companyId, startDate, endDate),
        this.getEmployeeStats(companyId)
      ]);

      return {
        dateRange,
        startDate,
        endDate,
        messageStats,
        inventoryStats,
        attendanceStats,
        employeeStats,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Get dashboard KPIs error:', error);
      throw error;
    }
  }

  /**
   * COMMUNICATION ANALYTICS
   */
  async getMessageStats(companyId, startDate, endDate) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_messages,
          COUNT(DISTINCT sender_id) as active_senders,
          COUNT(DISTINCT channel_id) as active_channels,
          AVG(LENGTH(content)) as avg_message_length,
          MAX(created_at) as last_message_time
        FROM messages m
        JOIN chat_channels cc ON m.channel_id = cc.id
        WHERE cc.company_id = $1 
          AND m.created_at >= $2 
          AND m.created_at <= $3
          AND m.deleted_at IS NULL
      `;

      const result = await pool.query(query, [companyId, startDate, endDate]);
      return result.rows[0] || {
        total_messages: 0,
        active_senders: 0,
        active_channels: 0,
        avg_message_length: 0
      };
    } catch (error) {
      console.error('Get message stats error:', error);
      throw error;
    }
  }

  async getChannelEngagement(companyId, limit = 10) {
    try {
      const query = `
        SELECT 
          cc.id,
          cc.name,
          COUNT(m.id) as message_count,
          COUNT(DISTINCT m.sender_id) as unique_users,
          MAX(m.created_at) as last_activity,
          cc.created_at as channel_created
        FROM chat_channels cc
        LEFT JOIN messages m ON cc.id = m.channel_id AND m.deleted_at IS NULL
        WHERE cc.company_id = $1 AND cc.deleted_at IS NULL
        GROUP BY cc.id, cc.name, cc.created_at
        ORDER BY message_count DESC
        LIMIT $2
      `;

      const result = await pool.query(query, [companyId, limit]);
      return result.rows;
    } catch (error) {
      console.error('Get channel engagement error:', error);
      throw error;
    }
  }

  async getUserActivityStats(companyId, startDate, endDate, limit = 20) {
    try {
      const query = `
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          COUNT(m.id) as messages_sent,
          COUNT(DISTINCT m.channel_id) as channels_participated,
          MAX(m.created_at) as last_message_time,
          COUNT(DISTINCT dm.id) as dms_sent,
          u.status
        FROM users u
        LEFT JOIN messages m ON u.id = m.sender_id 
          AND m.created_at >= $2 
          AND m.created_at <= $3
          AND m.deleted_at IS NULL
        LEFT JOIN direct_messages dm ON u.id = dm.sender_id 
          AND dm.created_at >= $2 
          AND dm.created_at <= $3
        WHERE u.company_id = $1 AND u.deleted_at IS NULL
        GROUP BY u.id, u.first_name, u.last_name, u.status
        ORDER BY messages_sent + COALESCE(dms_sent, 0) DESC
        LIMIT $4
      `;

      const result = await pool.query(query, [companyId, startDate, endDate, limit]);
      return result.rows;
    } catch (error) {
      console.error('Get user activity stats error:', error);
      throw error;
    }
  }

  /**
   * INVENTORY ANALYTICS
   */
  async getInventoryStats(companyId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_products,
          COUNT(CASE WHEN current_stock <= reorder_level THEN 1 END) as low_stock_count,
          COUNT(CASE WHEN current_stock = 0 THEN 1 END) as out_of_stock_count,
          SUM(current_stock) as total_units,
          SUM(current_stock * unit_price) as total_inventory_value,
          AVG(unit_price) as avg_unit_price,
          MAX(updated_at) as last_update
        FROM products
        WHERE company_id = $1 AND status = 'active'
      `;

      const result = await pool.query(query, [companyId]);
      return result.rows[0] || {
        total_products: 0,
        low_stock_count: 0,
        out_of_stock_count: 0,
        total_units: 0,
        total_inventory_value: 0
      };
    } catch (error) {
      console.error('Get inventory stats error:', error);
      throw error;
    }
  }

  async getInventoryMovement(companyId, days = 30, limit = 10) {
    try {
      const query = `
        SELECT 
          p.id,
          p.product_code,
          p.name,
          SUM(CASE WHEN it.transaction_type IN ('addition', 'return') THEN it.quantity ELSE 0 END) as units_added,
          SUM(CASE WHEN it.transaction_type IN ('removal', 'damaged', 'loss') THEN it.quantity ELSE 0 END) as units_removed,
          COUNT(it.id) as transaction_count,
          p.current_stock,
          (p.current_stock * p.unit_price) as current_value
        FROM products p
        LEFT JOIN inventory_transactions it ON p.id = it.product_id
          AND it.transaction_date >= NOW()::DATE - INTERVAL '1 day' * $2
          AND it.company_id = $1
        WHERE p.company_id = $1 AND p.status = 'active'
        GROUP BY p.id, p.product_code, p.name, p.current_stock, p.unit_price
        ORDER BY transaction_count DESC, units_removed DESC
        LIMIT $3
      `;

      const result = await pool.query(query, [companyId, days, limit]);
      return result.rows;
    } catch (error) {
      console.error('Get inventory movement error:', error);
      throw error;
    }
  }

  async getInventoryTrend(companyId, days = 30) {
    try {
      const query = `
        SELECT 
          DATE(it.transaction_date) as date,
          SUM(CASE WHEN it.transaction_type IN ('addition', 'return') THEN it.quantity ELSE 0 END) as additions,
          SUM(CASE WHEN it.transaction_type IN ('removal', 'damaged', 'loss') THEN it.quantity ELSE 0 END) as removals,
          COUNT(*) as transaction_count
        FROM inventory_transactions it
        WHERE it.company_id = $1
          AND it.transaction_date >= NOW()::DATE - INTERVAL '1 day' * $2
        GROUP BY DATE(it.transaction_date)
        ORDER BY date ASC
      `;

      const result = await pool.query(query, [companyId, days]);
      return result.rows;
    } catch (error) {
      console.error('Get inventory trend error:', error);
      throw error;
    }
  }

  /**
   * EMPLOYEE & ATTENDANCE ANALYTICS
   */
  async getAttendanceStats(companyId, startDate, endDate) {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT employee_id) as total_employees,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as total_present,
          SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as total_absent,
          SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as total_late,
          SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as total_leave,
          ROUND(
            CAST(SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as FLOAT) / 
            NULLIF(COUNT(*), 0) * 100, 2
          ) as attendance_percentage
        FROM attendances
        WHERE company_id = $1
          AND attendance_date >= $2 
          AND attendance_date <= $3
      `;

      const result = await pool.query(query, [companyId, startDate, endDate]);
      return result.rows[0] || {
        total_employees: 0,
        total_present: 0,
        total_absent: 0,
        total_late: 0,
        total_leave: 0,
        attendance_percentage: 0
      };
    } catch (error) {
      console.error('Get attendance stats error:', error);
      throw error;
    }
  }

  async getEmployeeStats(companyId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_employees,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
          COUNT(CASE WHEN role = 'manager' THEN 1 END) as manager_count,
          COUNT(CASE WHEN role = 'employee' THEN 1 END) as employee_count,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_employees,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_employees
        FROM users
        WHERE company_id = $1 AND deleted_at IS NULL
      `;

      const result = await pool.query(query, [companyId]);
      return result.rows[0] || {
        total_employees: 0,
        admin_count: 0,
        manager_count: 0,
        employee_count: 0,
        active_employees: 0,
        inactive_employees: 0
      };
    } catch (error) {
      console.error('Get employee stats error:', error);
      throw error;
    }
  }

  async getDepartmentPerformance(companyId) {
    try {
      const query = `
        SELECT 
          d.id,
          d.name,
          COUNT(DISTINCT u.id) as employee_count,
          COUNT(DISTINCT m.id) as messages_sent,
          SUM(p.current_stock * p.unit_price) as inventory_value,
          COUNT(DISTINCT p.id) as product_count,
          ROUND(
            CAST(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as FLOAT) /
            NULLIF(COUNT(DISTINCT a.id), 0) * 100, 2
          ) as avg_attendance
        FROM departments d
        LEFT JOIN users u ON d.id = u.department_id
        LEFT JOIN messages m ON u.id = m.sender_id
        LEFT JOIN products p ON d.id = p.department_id
        LEFT JOIN attendances a ON u.id = a.employee_id
        WHERE d.company_id = $1
        GROUP BY d.id, d.name
        ORDER BY employee_count DESC
      `;

      const result = await pool.query(query, [companyId]);
      return result.rows;
    } catch (error) {
      console.error('Get department performance error:', error);
      throw error;
    }
  }

  /**
   * TIME-SERIES DATA FOR CHARTS
   */
  async getMessageTimeSeries(companyId, days = 30) {
    try {
      const query = `
        SELECT 
          DATE(m.created_at) as date,
          COUNT(*) as message_count,
          COUNT(DISTINCT m.sender_id) as unique_users,
          COUNT(DISTINCT m.channel_id) as active_channels
        FROM messages m
        JOIN chat_channels cc ON m.channel_id = cc.id
        WHERE cc.company_id = $1
          AND m.created_at >= NOW() - INTERVAL '1 day' * $2
          AND m.deleted_at IS NULL
        GROUP BY DATE(m.created_at)
        ORDER BY date ASC
      `;

      const result = await pool.query(query, [companyId, days]);
      return result.rows;
    } catch (error) {
      console.error('Get message time series error:', error);
      throw error;
    }
  }

  async getAttendanceTrend(companyId, days = 30) {
    try {
      const query = `
        SELECT 
          attendance_date as date,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
          SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
          SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
          SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leave_count
        FROM attendances
        WHERE company_id = $1
          AND attendance_date >= NOW()::DATE - INTERVAL '1 day' * $2
        GROUP BY attendance_date
        ORDER BY date ASC
      `;

      const result = await pool.query(query, [companyId, days]);
      return result.rows;
    } catch (error) {
      console.error('Get attendance trend error:', error);
      throw error;
    }
  }

  /**
   * COMBINED METRICS
   */
  async getCompanyOverview(companyId) {
    try {
      const [
        company,
        users,
        departments,
        channels,
        products,
        messages
      ] = await Promise.all([
        pool.query('SELECT name FROM companies WHERE id = $1', [companyId]),
        pool.query('SELECT COUNT(*) as count FROM users WHERE company_id = $1 AND deleted_at IS NULL', [companyId]),
        pool.query('SELECT COUNT(*) as count FROM departments WHERE company_id = $1', [companyId]),
        pool.query('SELECT COUNT(*) as count FROM chat_channels WHERE company_id = $1 AND deleted_at IS NULL', [companyId]),
        pool.query('SELECT COUNT(*) as count FROM products WHERE company_id = $1 AND status = "active"', [companyId]),
        pool.query('SELECT COUNT(*) as count FROM messages m JOIN chat_channels cc ON m.channel_id = cc.id WHERE cc.company_id = $1 AND m.deleted_at IS NULL', [companyId])
      ]);

      return {
        company: company.rows[0],
        users: parseInt(users.rows[0].count),
        departments: parseInt(departments.rows[0].count),
        channels: parseInt(channels.rows[0].count),
        products: parseInt(products.rows[0].count),
        messages: parseInt(messages.rows[0].count)
      };
    } catch (error) {
      console.error('Get company overview error:', error);
      throw error;
    }
  }

  async getExecutiveSummary(companyId, days = 30) {
    try {
      const { startDate, endDate } = this.getDateRange('custom', days);

      const query = `
        SELECT 
          (SELECT COUNT(*) FROM users WHERE company_id = $1 AND deleted_at IS NULL) as total_users,
          (SELECT COUNT(*) FROM chat_channels WHERE company_id = $1 AND deleted_at IS NULL) as total_channels,
          (SELECT COUNT(*) FROM products WHERE company_id = $1 AND status = 'active') as total_products,
          (SELECT COUNT(*) FROM messages m 
            JOIN chat_channels cc ON m.channel_id = cc.id 
            WHERE cc.company_id = $1 
              AND m.created_at >= $2 
              AND m.deleted_at IS NULL
          ) as messages_this_period,
          (SELECT SUM(current_stock * unit_price) FROM products WHERE company_id = $1 AND status = 'active') as total_inventory_value,
          (SELECT COUNT(*) FROM inventory_transactions 
            WHERE company_id = $1 
              AND transaction_date >= $2::DATE
          ) as transactions_this_period,
          (SELECT ROUND(CAST(SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as FLOAT) / 
            NULLIF(COUNT(*), 0) * 100, 2)
            FROM attendances 
            WHERE company_id = $1 
              AND attendance_date >= $2::DATE
          ) as attendance_rate
      `;

      const result = await pool.query(query, [companyId, startDate]);
      return result.rows[0];
    } catch (error) {
      console.error('Get executive summary error:', error);
      throw error;
    }
  }

  /**
   * EXPORT DATA
   */
  async exportAnalyticsReport(companyId, reportType = 'full', startDate, endDate) {
    try {
      const report = {
        company_id: companyId,
        report_type: reportType,
        generated_at: new Date(),
        date_range: { startDate, endDate }
      };

      if (['full', 'communication'].includes(reportType)) {
        report.messages = await this.getMessageStats(companyId, startDate, endDate);
        report.channel_engagement = await this.getChannelEngagement(companyId);
        report.user_activity = await this.getUserActivityStats(companyId, startDate, endDate);
        report.message_trend = await this.getMessageTimeSeries(companyId, 30);
      }

      if (['full', 'inventory'].includes(reportType)) {
        report.inventory = await this.getInventoryStats(companyId);
        report.inventory_movement = await this.getInventoryMovement(companyId);
        report.inventory_trend = await this.getInventoryTrend(companyId);
      }

      if (['full', 'attendance'].includes(reportType)) {
        report.attendance = await this.getAttendanceStats(companyId, startDate, endDate);
        report.attendance_trend = await this.getAttendanceTrend(companyId);
      }

      if (['full', 'department'].includes(reportType)) {
        report.department_performance = await this.getDepartmentPerformance(companyId);
      }

      return report;
    } catch (error) {
      console.error('Export analytics report error:', error);
      throw error;
    }
  }

  /**
   * HELPER METHODS
   */
  getDateRange(range = 'month', customDays = null) {
    const endDate = new Date();
    const startDate = new Date();

    switch (range) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'custom':
        startDate.setDate(endDate.getDate() - customDays);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 1);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }

  async getCachedMetrics(companyId, cacheKey) {
    // Placeholder for Redis caching
    // In production, check Redis first before querying database
    return null;
  }
}

export const analyticsService = new AnalyticsService();
