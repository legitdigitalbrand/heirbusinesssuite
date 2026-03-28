import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const InventoryPage = () => {
  const { user } = useAuthStore();
  const [tab, setTab] = useState('products'); // 'products', 'transactions', 'reports'
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showAdjustStock, setShowAdjustStock] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [reorderRecommendations, setReorderRecommendations] = useState([]);

  // Form states
  const [productForm, setProductForm] = useState({
    productCode: '',
    name: '',
    description: '',
    unitPrice: 0,
    reorderLevel: 0,
    reorderQuantity: 0,
    currency: 'USD'
  });

  const [adjustForm, setAdjustForm] = useState({
    quantity: '',
    transactionType: 'addition',
    referenceNumber: '',
    notes: ''
  });

  // Fetch products on tab change
  useEffect(() => {
    if (tab === 'products') {
      fetchProducts();
    } else if (tab === 'transactions') {
      fetchTransactions();
    } else if (tab === 'reports') {
      fetchReports();
    }
  }, [tab]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/inventory/products', {
        params: { limit: 50, offset: 0 }
      });
      setProducts(response.data.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/inventory/transactions', {
        params: { limit: 100, offset: 0 }
      });
      setTransactions(response.data.data);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [summaryRes, lowStockRes, reorderRes] = await Promise.all([
        api.get('/api/inventory/reports/summary'),
        api.get('/api/inventory/stock/low-stock'),
        api.get('/api/inventory/reports/reorder-recommendations')
      ]);

      setSummary(summaryRes.data.data);
      setLowStockProducts(lowStockRes.data.data);
      setReorderRecommendations(reorderRes.data.data);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/inventory/products', productForm);
      toast.success('Product created successfully');
      setShowCreateProduct(false);
      setProductForm({
        productCode: '',
        name: '',
        description: '',
        unitPrice: 0,
        reorderLevel: 0,
        reorderQuantity: 0,
        currency: 'USD'
      });
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create product');
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/inventory/products/${selectedProduct.id}/adjust-stock`, {
        quantity: parseFloat(adjustForm.quantity),
        transactionType: adjustForm.transactionType,
        referenceNumber: adjustForm.referenceNumber,
        notes: adjustForm.notes
      });
      toast.success('Stock adjusted successfully');
      setShowAdjustStock(false);
      setAdjustForm({
        quantity: '',
        transactionType: 'addition',
        referenceNumber: '',
        notes: ''
      });
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to adjust stock');
    }
  };

  const formatCurrency = (value, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(value);
  };

  const getStockLevelColor = (stockLevel) => {
    switch (stockLevel) {
      case 'low':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'normal':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStockLevelBadge = (stockLevel) => {
    const colors = {
      low: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      normal: 'bg-green-100 text-green-800'
    };
    return colors[stockLevel] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600 mt-1">Track products, stock levels, and transactions</p>
          </div>
          {tab === 'products' && (
            <button
              onClick={() => setShowCreateProduct(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition"
            >
              + New Product
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-8">
          {['products', 'transactions', 'reports'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-4 px-2 border-b-2 font-medium transition capitalize ${
                tab === t
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t === 'products' ? 'Products' : t === 'transactions' ? 'Transactions' : 'Reports'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : tab === 'products' ? (
          // Products Tab
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.length === 0 ? (
                <p className="text-gray-500">No products found</p>
              ) : (
                products.map(product => (
                  <div key={product.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-500">SKU: {product.product_code}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStockLevelBadge(product.stock_level)}`}>
                        {product.stock_level}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Stock:</span>
                        <span className="font-semibold">{product.current_stock}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reorder Level:</span>
                        <span className="font-semibold">{product.reorder_level}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Unit Price:</span>
                        <span className="font-semibold">{formatCurrency(product.unit_price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Value:</span>
                        <span className="font-semibold text-emerald-600">
                          {formatCurrency(product.current_stock * product.unit_price)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowAdjustStock(true);
                      }}
                      className="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-medium py-2 rounded-lg transition"
                    >
                      Adjust Stock
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : tab === 'transactions' ? (
          // Transactions Tab
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Recorded By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map(transaction => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900">{transaction.product_name}</p>
                          <p className="text-xs text-gray-500">{transaction.product_code}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium capitalize">
                          {transaction.transaction_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold">
                        {transaction.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {transaction.first_name} {transaction.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {new Date(transaction.transaction_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          // Reports Tab
          <div className="space-y-6">
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-gray-600 text-sm">Total Products</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-2">{summary.total_products}</p>
                  <p className="text-xs text-gray-500 mt-2">{summary.active_products} active</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-gray-600 text-sm">Total Stock Units</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {parseFloat(summary.total_stock_units || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Across all products</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-gray-600 text-sm">Inventory Value</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    {formatCurrency(summary.total_inventory_value || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Total value</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-gray-600 text-sm">Low Stock Alert</p>
                  <p className={`text-3xl font-bold mt-2 ${
                    summary.low_stock_count > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {summary.low_stock_count}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Products to reorder</p>
                </div>
              </div>
            )}

            {/* Low Stock Products */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Products</h3>
              {lowStockProducts.length === 0 ? (
                <p className="text-gray-500">No low stock products</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Product</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Current Stock</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Reorder Level</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Unit Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {lowStockProducts.map(product => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <p className="text-xs text-gray-500">{product.product_code}</p>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-red-600 font-semibold">{product.current_stock}</td>
                          <td className="px-4 py-2">{product.reorder_level}</td>
                          <td className="px-4 py-2">{formatCurrency(product.unit_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Reorder Recommendations */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reorder Recommendations</h3>
              {reorderRecommendations.length === 0 ? (
                <p className="text-gray-500">No reorder recommendations</p>
              ) : (
                <div className="space-y-3">
                  {reorderRecommendations.map(item => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Current: {item.current_stock} | Recommended: {item.reorder_quantity}
                          </p>
                          <p className="text-sm text-gray-600">
                            Quantity to order: {item.recommended_quantity}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          item.priority === 'soon' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-emerald-600 mt-2">
                        Estimated Cost: {formatCurrency(item.estimated_cost)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Product Modal */}
      {showCreateProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Product</h2>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <input
                type="text"
                placeholder="Product Code"
                value={productForm.productCode}
                onChange={(e) => setProductForm({ ...productForm, productCode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
              <input
                type="text"
                placeholder="Product Name"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
              <textarea
                placeholder="Description"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows="3"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Unit Price"
                  step="0.01"
                  value={productForm.unitPrice}
                  onChange={(e) => setProductForm({ ...productForm, unitPrice: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="number"
                  placeholder="Reorder Level"
                  step="0.01"
                  value={productForm.reorderLevel}
                  onChange={(e) => setProductForm({ ...productForm, reorderLevel: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <input
                type="number"
                placeholder="Reorder Quantity"
                step="0.01"
                value={productForm.reorderQuantity}
                onChange={(e) => setProductForm({ ...productForm, reorderQuantity: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg transition"
                >
                  Create Product
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateProduct(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustStock && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Adjust Stock</h2>
            <p className="text-gray-600 mb-4">{selectedProduct.name}</p>
            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                <select
                  value={adjustForm.transactionType}
                  onChange={(e) => setAdjustForm({ ...adjustForm, transactionType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="addition">Addition (Stock In)</option>
                  <option value="removal">Removal (Stock Out)</option>
                  <option value="adjustment">Adjustment (Correction)</option>
                  <option value="return">Return</option>
                  <option value="damaged">Damaged</option>
                  <option value="loss">Loss/Missing</option>
                </select>
              </div>
              <input
                type="number"
                placeholder="Quantity"
                step="0.01"
                value={adjustForm.quantity}
                onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
              <input
                type="text"
                placeholder="Reference Number (PO, SO, etc)"
                value={adjustForm.referenceNumber}
                onChange={(e) => setAdjustForm({ ...adjustForm, referenceNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <textarea
                placeholder="Notes"
                value={adjustForm.notes}
                onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows="3"
              />
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg transition"
                >
                  Adjust Stock
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdjustStock(false);
                    setSelectedProduct(null);
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
