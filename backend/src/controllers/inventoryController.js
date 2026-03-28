import { inventoryService } from '../services/inventoryService.js';

// ========== PRODUCT MANAGEMENT ==========

export const createProduct = async (req, res) => {
  try {
    const {
      productCode, name, description,
      unitPrice, reorderLevel, reorderQuantity, currency
    } = req.body;

    const companyId = req.user.company_id;

    if (!productCode || !name) {
      return res.status(400).json({ error: 'Product code and name are required' });
    }

    const product = await inventoryService.createProduct({
      productCode, name, description,
      unitPrice, reorderLevel, reorderQuantity, currency
    }, companyId);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    const status = error.message.includes('already exists') ? 409 : 500;
    res.status(status).json({ error: error.message });
  }
};

export const getProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const companyId = req.user.company_id;

    const product = await inventoryService.getProduct(productId, companyId);

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(error.message.includes('not found') ? 404 : 500)
      .json({ error: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { limit = 50, offset = 0, status, stockLevel, search } = req.query;
    const companyId = req.user.company_id;

    const products = await inventoryService.getProducts(
      companyId,
      parseInt(limit),
      parseInt(offset),
      { status, stockLevel, search }
    );

    const total = await inventoryService.getProductsCount(companyId, { status, search });

    res.json({
      success: true,
      data: products,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const companyId = req.user.company_id;
    const updateData = req.body;

    const product = await inventoryService.updateProduct(productId, companyId, updateData);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(error.message.includes('not found') ? 404 : 500)
      .json({ error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const companyId = req.user.company_id;

    const product = await inventoryService.deleteProduct(productId, companyId);

    res.json({
      success: true,
      message: 'Product deleted successfully',
      data: product
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(error.message.includes('not found') ? 404 : 500)
      .json({ error: error.message });
  }
};

// ========== STOCK TRACKING ==========

export const adjustStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, transactionType, referenceNumber, departmentId, notes } = req.body;
    const companyId = req.user.company_id;
    const userId = req.user.id;

    if (!quantity || !transactionType) {
      return res.status(400).json({ error: 'Quantity and transaction type are required' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    const result = await inventoryService.adjustStock(
      productId, companyId, quantity, transactionType,
      referenceNumber, departmentId, notes, userId
    );

    res.json({
      success: true,
      message: 'Stock adjusted successfully',
      data: result
    });
  } catch (error) {
    console.error('Adjust stock error:', error);
    const status = error.message.includes('Insufficient stock') ? 400 :
                   error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
};

export const getCurrentStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const companyId = req.user.company_id;

    const stock = await inventoryService.getCurrentStock(productId, companyId);

    res.json({
      success: true,
      data: stock
    });
  } catch (error) {
    console.error('Get current stock error:', error);
    res.status(error.message.includes('not found') ? 404 : 500)
      .json({ error: error.message });
  }
};

export const getLowStockProducts = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const products = await inventoryService.getLowStockProducts(companyId);

    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({ error: 'Failed to retrieve low stock products' });
  }
};

// ========== TRANSACTION LOGGING ==========

export const getTransactionHistory = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 100, offset = 0, transactionType, startDate, endDate } = req.query;
    const companyId = req.user.company_id;

    const transactions = await inventoryService.getTransactionHistory(
      productId, companyId,
      parseInt(limit), parseInt(offset),
      { transactionType, startDate, endDate }
    );

    const total = await inventoryService.getTransactionHistoryCount(productId, companyId);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total
      }
    });
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({ error: 'Failed to retrieve transaction history' });
  }
};

export const getCompanyTransactions = async (req, res) => {
  try {
    const { limit = 100, offset = 0, transactionType, startDate, endDate, status } = req.query;
    const companyId = req.user.company_id;

    const transactions = await inventoryService.getCompanyTransactions(
      companyId,
      parseInt(limit), parseInt(offset),
      { transactionType, startDate, endDate, status }
    );

    res.json({
      success: true,
      data: transactions,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Get company transactions error:', error);
    res.status(500).json({ error: 'Failed to retrieve transactions' });
  }
};

// ========== REPORTS & ANALYTICS ==========

export const getInventorySummary = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const summary = await inventoryService.getInventorySummary(companyId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get inventory summary error:', error);
    res.status(500).json({ error: 'Failed to retrieve inventory summary' });
  }
};

export const getInventoryValueByDepartment = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const data = await inventoryService.getInventoryValueByDepartment(companyId);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get inventory by department error:', error);
    res.status(500).json({ error: 'Failed to retrieve inventory by department' });
  }
};

export const getTransactionStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const companyId = req.user.company_id;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const stats = await inventoryService.getTransactionStats(companyId, startDate, endDate);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve transaction statistics' });
  }
};

export const getTopMovingProducts = async (req, res) => {
  try {
    const { days = 30, limit = 10 } = req.query;
    const companyId = req.user.company_id;

    const products = await inventoryService.getTopMovingProducts(
      companyId,
      parseInt(days),
      parseInt(limit)
    );

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get top moving products error:', error);
    res.status(500).json({ error: 'Failed to retrieve top moving products' });
  }
};

export const getReorderRecommendations = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const recommendations = await inventoryService.getReorderRecommendations(companyId);

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length
    });
  } catch (error) {
    console.error('Get reorder recommendations error:', error);
    res.status(500).json({ error: 'Failed to retrieve reorder recommendations' });
  }
};
