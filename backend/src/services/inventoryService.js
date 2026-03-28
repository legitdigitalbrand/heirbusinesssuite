import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database.js';
import { redis } from '../config/redis.js';

class InventoryService {
  // ========== PRODUCT MANAGEMENT ==========

  /**
   * Create a new product
   * @param {Object} productData - { productCode, name, description, unitPrice, reorderLevel, reorderQuantity, currency }
   * @param {string} companyId
   * @returns Product object
   */
  async createProduct(productData, companyId) {
    const {
      productCode,
      name,
      description,
      unitPrice = 0,
      reorderLevel = 0,
      reorderQuantity = 0,
      currency = 'USD',
      status = 'active'
    } = productData;

    if (!productCode || !name) {
      throw new Error('Product code and name are required');
    }

    const id = uuidv4();
    const query = `
      INSERT INTO products (
        id, company_id, product_code, name, description, 
        unit_price, reorder_level, reorder_quantity, 
        currency, status, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [
        id, companyId, productCode, name, description,
        unitPrice, reorderLevel, reorderQuantity,
        currency, status
      ]);

      // Clear cache
      await redis.del(`products:${companyId}`, `product:active:${companyId}`);

      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error(`Product code "${productCode}" already exists in this company`);
      }
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getProduct(productId, companyId) {
    const query = `
      SELECT *, 
        (CASE 
          WHEN current_stock <= reorder_level THEN 'low' 
          WHEN current_stock <= (reorder_level * 1.5) THEN 'medium'
          ELSE 'normal'
        END) as stock_level
      FROM products
      WHERE id = $1 AND company_id = $2
    `;

    const result = await pool.query(query, [productId, companyId]);
    if (result.rows.length === 0) {
      throw new Error('Product not found');
    }

    return result.rows[0];
  }

  /**
   * Get all products for company with pagination
   */
  async getProducts(companyId, limit = 50, offset = 0, filters = {}) {
    let query = `
      SELECT *, 
        (CASE 
          WHEN current_stock <= reorder_level THEN 'low' 
          WHEN current_stock <= (reorder_level * 1.5) THEN 'medium'
          ELSE 'normal'
        END) as stock_level
      FROM products
      WHERE company_id = $1
    `;

    const params = [companyId];
    let paramIndex = 2;

    // Filter by status
    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    // Filter by stock level
    if (filters.stockLevel) {
      if (filters.stockLevel === 'low') {
        query += ` AND current_stock <= reorder_level`;
      } else if (filters.stockLevel === 'medium') {
        query += ` AND current_stock > reorder_level AND current_stock <= (reorder_level * 1.5)`;
      } else if (filters.stockLevel === 'normal') {
        query += ` AND current_stock > (reorder_level * 1.5)`;
      }
    }

    // Search by name or code
    if (filters.search) {
      query += ` AND (name ILIKE $${paramIndex} OR product_code ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Add pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get products count for pagination
   */
  async getProductsCount(companyId, filters = {}) {
    let query = `SELECT COUNT(*) as count FROM products WHERE company_id = $1`;
    const params = [companyId];
    let paramIndex = 2;

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.search) {
      query += ` AND (name ILIKE $${paramIndex} OR product_code ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Update product details
   */
  async updateProduct(productId, companyId, updateData) {
    const {
      name,
      description,
      unitPrice,
      reorderLevel,
      reorderQuantity,
      currency,
      status
    } = updateData;

    const updates = [];
    const params = [productId, companyId];
    let paramIndex = 3;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      params.push(name);
      paramIndex++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(description);
      paramIndex++;
    }
    if (unitPrice !== undefined) {
      updates.push(`unit_price = $${paramIndex}`);
      params.push(unitPrice);
      paramIndex++;
    }
    if (reorderLevel !== undefined) {
      updates.push(`reorder_level = $${paramIndex}`);
      params.push(reorderLevel);
      paramIndex++;
    }
    if (reorderQuantity !== undefined) {
      updates.push(`reorder_quantity = $${paramIndex}`);
      params.push(reorderQuantity);
      paramIndex++;
    }
    if (currency !== undefined) {
      updates.push(`currency = $${paramIndex}`);
      params.push(currency);
      paramIndex++;
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.getProduct(productId, companyId);
    }

    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE products
      SET ${updates.join(', ')}
      WHERE id = $1 AND company_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      throw new Error('Product not found');
    }

    // Clear cache
    await redis.del(`products:${companyId}`, `product:${productId}`);

    return result.rows[0];
  }

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(productId, companyId) {
    const query = `
      UPDATE products
      SET status = 'inactive', updated_at = NOW()
      WHERE id = $1 AND company_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [productId, companyId]);
    if (result.rows.length === 0) {
      throw new Error('Product not found');
    }

    await redis.del(`products:${companyId}`, `product:${productId}`);
    return result.rows[0];
  }

  // ========== STOCK TRACKING ==========

  /**
   * Adjust stock (add, remove, or correct)
   */
  async adjustStock(productId, companyId, quantity, transactionType, referenceNumber = null, departmentId = null, notes = null, userId) {
    const connection = await pool.connect();

    try {
      await connection.query('BEGIN');

      // Get product
      const productQuery = `SELECT * FROM products WHERE id = $1 AND company_id = $2 FOR UPDATE`;
      const productResult = await connection.query(productQuery, [productId, companyId]);

      if (productResult.rows.length === 0) {
        throw new Error('Product not found');
      }

      const product = productResult.rows[0];

      // Validate transaction type
      const validTypes = ['addition', 'removal', 'adjustment', 'return', 'damaged', 'loss'];
      if (!validTypes.includes(transactionType)) {
        throw new Error(`Invalid transaction type. Allowed: ${validTypes.join(', ')}`);
      }

      // Calculate new stock
      let newStock = product.current_stock;
      if (['addition', 'return'].includes(transactionType)) {
        newStock += quantity;
      } else {
        newStock -= quantity;
      }

      // Prevent negative stock (except for adjustments which might need to go negative)
      if (newStock < 0 && transactionType !== 'adjustment') {
        throw new Error(`Insufficient stock. Current: ${product.current_stock}, Requested: ${quantity}`);
      }

      // Create transaction record
      const transactionId = uuidv4();
      const transactionQuery = `
        INSERT INTO inventory_transactions (
          id, company_id, product_id, transaction_type, quantity,
          reference_number, transaction_date, recorded_by, department_id,
          notes, status, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW()::DATE, $7, $8, $9, 'completed', NOW())
        RETURNING *
      `;

      const transactionResult = await connection.query(transactionQuery, [
        transactionId, companyId, productId, transactionType, quantity,
        referenceNumber, userId, departmentId, notes
      ]);

      // Update product stock
      const updateQuery = `
        UPDATE products
        SET current_stock = $1, updated_at = NOW()
        WHERE id = $2 AND company_id = $3
        RETURNING *
      `;

      const updateResult = await connection.query(updateQuery, [newStock, productId, companyId]);

      await connection.query('COMMIT');

      // Clear cache
      await redis.del(`product:${productId}`, `products:${companyId}`);

      return {
        transaction: transactionResult.rows[0],
        product: updateResult.rows[0]
      };
    } catch (error) {
      await connection.query('ROLLBACK');
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get current stock for product
   */
  async getCurrentStock(productId, companyId) {
    const query = `
      SELECT 
        id, product_code, name, current_stock, 
        reorder_level, unit_price, currency,
        (CASE 
          WHEN current_stock <= reorder_level THEN 'low' 
          WHEN current_stock <= (reorder_level * 1.5) THEN 'medium'
          ELSE 'normal'
        END) as stock_level
      FROM products
      WHERE id = $1 AND company_id = $2
    `;

    const result = await pool.query(query, [productId, companyId]);
    if (result.rows.length === 0) {
      throw new Error('Product not found');
    }

    return result.rows[0];
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(companyId) {
    const query = `
      SELECT 
        id, product_code, name, current_stock, 
        reorder_level, reorder_quantity, unit_price
      FROM products
      WHERE company_id = $1 
        AND status = 'active'
        AND current_stock <= reorder_level
      ORDER BY current_stock ASC
    `;

    const result = await pool.query(query, [companyId]);
    return result.rows;
  }

  // ========== TRANSACTION LOGGING & HISTORY ==========

  /**
   * Get transaction history for product
   */
  async getTransactionHistory(productId, companyId, limit = 100, offset = 0, filters = {}) {
    let query = `
      SELECT 
        t.*,
        p.product_code, p.name as product_name,
        u.first_name, u.last_name, u.email,
        d.name as department_name
      FROM inventory_transactions t
      JOIN products p ON t.product_id = p.id
      JOIN users u ON t.recorded_by = u.id
      LEFT JOIN departments d ON t.department_id = d.id
      WHERE t.product_id = $1 AND t.company_id = $2
    `;

    const params = [productId, companyId];
    let paramIndex = 3;

    // Filter by transaction type
    if (filters.transactionType) {
      query += ` AND t.transaction_type = $${paramIndex}`;
      params.push(filters.transactionType);
      paramIndex++;
    }

    // Filter by date range
    if (filters.startDate) {
      query += ` AND t.transaction_date >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      query += ` AND t.transaction_date <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get transaction history count
   */
  async getTransactionHistoryCount(productId, companyId) {
    const query = `
      SELECT COUNT(*) as count
      FROM inventory_transactions
      WHERE product_id = $1 AND company_id = $2
    `;

    const result = await pool.query(query, [productId, companyId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get company-wide transaction history
   */
  async getCompanyTransactions(companyId, limit = 100, offset = 0, filters = {}) {
    let query = `
      SELECT 
        t.*,
        p.product_code, p.name as product_name,
        u.first_name, u.last_name,
        d.name as department_name
      FROM inventory_transactions t
      JOIN products p ON t.product_id = p.id
      JOIN users u ON t.recorded_by = u.id
      LEFT JOIN departments d ON t.department_id = d.id
      WHERE t.company_id = $1
    `;

    const params = [companyId];
    let paramIndex = 2;

    // Filter by transaction type
    if (filters.transactionType) {
      query += ` AND t.transaction_type = $${paramIndex}`;
      params.push(filters.transactionType);
      paramIndex++;
    }

    // Filter by date range
    if (filters.startDate) {
      query += ` AND t.transaction_date >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      query += ` AND t.transaction_date <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    // Filter by status
    if (filters.status) {
      query += ` AND t.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  // ========== REPORTS & ANALYTICS ==========

  /**
   * Get inventory summary
   */
  async getInventorySummary(companyId) {
    const query = `
      SELECT 
        COUNT(*) as total_products,
        SUM(current_stock) as total_stock_units,
        SUM(current_stock * unit_price) as total_inventory_value,
        COUNT(CASE WHEN current_stock <= reorder_level THEN 1 END) as low_stock_count,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_products,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_products,
        AVG(unit_price) as avg_unit_price,
        MIN(created_at) as database_created_at
      FROM products
      WHERE company_id = $1 AND status = 'active'
    `;

    const result = await pool.query(query, [companyId]);
    return result.rows[0];
  }

  /**
   * Get inventory value by category/department
   */
  async getInventoryValueByDepartment(companyId) {
    const query = `
      SELECT 
        d.id, d.name as department_name,
        COUNT(p.id) as product_count,
        SUM(p.current_stock) as total_units,
        SUM(p.current_stock * p.unit_price) as total_value,
        COALESCE(SUM(t.quantity), 0) as total_transactions
      FROM departments d
      LEFT JOIN products p ON d.id = p.department_id AND p.company_id = $1
      LEFT JOIN inventory_transactions t ON p.id = t.product_id AND t.company_id = $1
      WHERE d.company_id = $1
      GROUP BY d.id, d.name
      ORDER BY total_value DESC NULLS LAST
    `;

    const result = await pool.query(query, [companyId]);
    return result.rows;
  }

  /**
   * Get transaction statistics for date range
   */
  async getTransactionStats(companyId, startDate, endDate) {
    const query = `
      SELECT 
        transaction_type,
        COUNT(*) as count,
        SUM(quantity) as total_quantity,
        AVG(quantity) as avg_quantity
      FROM inventory_transactions
      WHERE company_id = $1
        AND transaction_date >= $2
        AND transaction_date <= $3
      GROUP BY transaction_type
      ORDER BY count DESC
    `;

    const result = await pool.query(query, [companyId, startDate, endDate]);
    return result.rows;
  }

  /**
   * Get top moving products
   */
  async getTopMovingProducts(companyId, days = 30, limit = 10) {
    const query = `
      SELECT 
        p.id, p.product_code, p.name,
        SUM(CASE WHEN t.transaction_type IN ('addition', 'return') THEN t.quantity ELSE 0 END) as total_additions,
        SUM(CASE WHEN t.transaction_type IN ('removal', 'damaged', 'loss') THEN t.quantity ELSE 0 END) as total_removals,
        COUNT(t.id) as total_transactions,
        p.current_stock,
        p.unit_price,
        (p.current_stock * p.unit_price) as current_value
      FROM products p
      LEFT JOIN inventory_transactions t ON p.id = t.product_id 
        AND t.company_id = $1
        AND t.transaction_date >= NOW()::DATE - INTERVAL '1 day' * $2
      WHERE p.company_id = $1 AND p.status = 'active'
      GROUP BY p.id, p.product_code, p.name, p.current_stock, p.unit_price
      ORDER BY total_transactions DESC, total_removals DESC
      LIMIT $3
    `;

    const result = await pool.query(query, [companyId, days, limit]);
    return result.rows;
  }

  /**
   * Get reorder recommendations
   */
  async getReorderRecommendations(companyId) {
    const query = `
      SELECT 
        id, product_code, name, current_stock,
        reorder_level, reorder_quantity,
        (reorder_quantity - current_stock) as recommended_quantity,
        CASE 
          WHEN current_stock <= reorder_level THEN 'urgent'
          WHEN current_stock <= (reorder_level * 1.5) THEN 'soon'
          ELSE 'scheduled'
        END as priority,
        unit_price,
        ((reorder_quantity - current_stock) * unit_price) as estimated_cost
      FROM products
      WHERE company_id = $1
        AND status = 'active'
        AND current_stock < reorder_quantity
      ORDER BY priority DESC, estimated_cost DESC
    `;

    const result = await pool.query(query, [companyId]);
    return result.rows;
  }
}

export const inventoryService = new InventoryService();
