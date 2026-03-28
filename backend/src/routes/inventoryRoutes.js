import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as inventoryController from '../controllers/inventoryController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ========== PRODUCT MANAGEMENT ==========

// Create product (Admin/Manager only)
router.post('/products', authorize(['admin', 'manager']), inventoryController.createProduct);

// Get all products
router.get('/products', inventoryController.getProducts);

// Get specific product
router.get('/products/:productId', inventoryController.getProduct);

// Update product (Admin/Manager only)
router.put('/products/:productId', authorize(['admin', 'manager']), inventoryController.updateProduct);

// Delete product (Admin only)
router.delete('/products/:productId', authorize(['admin']), inventoryController.deleteProduct);

// ========== STOCK TRACKING ==========

// Adjust stock (add, remove, etc) - Warehouse staff, Admin, Manager
router.post('/products/:productId/adjust-stock', authorize(['admin', 'manager', 'warehouse_staff']), inventoryController.adjustStock);

// Get current stock for product
router.get('/products/:productId/stock', inventoryController.getCurrentStock);

// Get all low stock products
router.get('/stock/low-stock', inventoryController.getLowStockProducts);

// ========== TRANSACTION LOGGING & HISTORY ==========

// Get transaction history for specific product
router.get('/products/:productId/transactions', inventoryController.getTransactionHistory);

// Get company-wide transaction history
router.get('/transactions', inventoryController.getCompanyTransactions);

// ========== REPORTS & ANALYTICS ==========

// Get inventory summary
router.get('/reports/summary', inventoryController.getInventorySummary);

// Get inventory value by department
router.get('/reports/by-department', inventoryController.getInventoryValueByDepartment);

// Get transaction statistics
router.get('/reports/transaction-stats', inventoryController.getTransactionStats);

// Get top moving products
router.get('/reports/top-moving', inventoryController.getTopMovingProducts);

// Get reorder recommendations
router.get('/reports/reorder-recommendations', inventoryController.getReorderRecommendations);

export default router;
