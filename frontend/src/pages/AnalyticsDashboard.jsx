import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  MessageSquare,
  Package,
  Users,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  PieChart,
  LineChart as LineChartIcon
} from 'lucide-react';

const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState('month');
  const [kpis, setKpis] = useState(null);
  const [overview, setOverview] = useState(null);
  const [userActivity, setUserActivity] = useState([]);
  const [channelEngagement, setChannelEngagement] = useState([]);
  const [inventoryStats, setInventoryStats] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [department, setDepartment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [
        kpiRes,
        overviewRes,
        userActivityRes,
        channelRes,
        inventoryRes,
        attendanceRes,
        departmentRes
      ] = await Promise.all([
        fetch(`/api/analytics/dashboard-kpis?dateRange=${dateRange}`, { headers }),
        fetch('/api/analytics/overview', { headers }),
        fetch(`/api/analytics/user-activity?dateRange=${dateRange}&limit=10`, { headers }),
        fetch('/api/analytics/channel-engagement?limit=10', { headers }),
        fetch('/api/analytics/inventory-stats', { headers }),
        fetch(`/api/analytics/attendance-stats?dateRange=${dateRange}`, { headers }),
        fetch('/api/analytics/department-performance', { headers })
      ]);

      if (!kpiRes.ok || !overviewRes.ok) throw new Error('Failed to fetch analytics');

      setKpis(await kpiRes.json());
      setOverview(await overviewRes.json());
      setUserActivity((await userActivityRes.json()).data || []);
      setChannelEngagement((await channelRes.json()).data || []);
      setInventoryStats((await inventoryRes.json()).data);
      setAttendance((await attendanceRes.json()).data);
      setDepartment((await departmentRes.json()).data || []);
      setError(null);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const handleExport = async (format = 'json') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/analytics/export?format=${format}&days=${dateRange === 'month' ? 30 : dateRange === 'week' ? 7 : 365}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().getTime()}.${format === 'csv' ? 'csv' : 'json'}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export analytics');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-900/20 border border-red-700 rounded-lg">
        <p className="text-red-400">Error loading analytics: {error}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  const kpiData = kpis?.data || {};
  const overviewData = overview?.data || {};

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Analytics Dashboard</h1>
            <p className="text-gray-400">Company-wide metrics and performance insights</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-emerald-500 text-white rounded-lg focus:outline-none focus:border-emerald-400"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
            <button
              onClick={() => fetchAnalytics()}
              className="p-2 bg-gray-800 hover:bg-gray-700 text-emerald-400 rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('json')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-emerald-500 transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-300 text-sm font-medium">Total Users</h3>
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-white">{overviewData.users || 0}</p>
            <p className="text-gray-500 text-sm mt-2">Active employees</p>
          </div>

          {/* Total Messages */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-emerald-500 transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-300 text-sm font-medium">Messages</h3>
              <MessageSquare className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-white">{kpiData.messageStats?.total_messages || 0}</p>
            <p className="text-gray-500 text-sm mt-2">{kpiData.messageStats?.active_senders || 0} active senders</p>
          </div>

          {/* Inventory Value */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-emerald-500 transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-300 text-sm font-medium">Inventory Value</h3>
              <Package className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-white">
              ${inventoryStats?.total_inventory_value?.toLocaleString() || 0}
            </p>
            <p className="text-gray-500 text-sm mt-2">{inventoryStats?.total_products || 0} products</p>
          </div>

          {/* Attendance Rate */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-emerald-500 transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-300 text-sm font-medium">Attendance Rate</h3>
              <Calendar className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-3xl font-bold text-white">{attendance?.attendance_percentage || 0}%</p>
            <p className="text-gray-500 text-sm mt-2">{attendance?.total_present || 0} present today</p>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Communication Stats */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              Communication
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Active Channels</span>
                <span className="text-2xl font-bold text-white">{kpiData.messageStats?.active_channels || 0}</span>
              </div>
              <div className="h-px bg-gray-700"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Avg Message Length</span>
                <span className="text-xl font-semibold text-emerald-400">
                  {Math.round(kpiData.messageStats?.avg_message_length || 0)} chars
                </span>
              </div>
            </div>
          </div>

          {/* Inventory Stats */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-green-400" />
              Inventory Health
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Low Stock</span>
                <span className="text-2xl font-bold text-yellow-500">{inventoryStats?.low_stock_count || 0}</span>
              </div>
              <div className="h-px bg-gray-700"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Out of Stock</span>
                <span className="text-2xl font-bold text-red-500">{inventoryStats?.out_of_stock_count || 0}</span>
              </div>
            </div>
          </div>

          {/* Employee Distribution */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Team Distribution
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Admins</span>
                <span className="text-xl font-semibold text-white">{kpiData.employeeStats?.admin_count || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Managers</span>
                <span className="text-xl font-semibold text-white">{kpiData.employeeStats?.manager_count || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Employees</span>
                <span className="text-xl font-semibold text-white">{kpiData.employeeStats?.employee_count || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Users & Channels Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Top Active Users */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Active Users</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {userActivity.length > 0 ? (
                userActivity.map((user, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
                    <div>
                      <p className="text-white font-medium">{user.first_name} {user.last_name}</p>
                      <p className="text-gray-400 text-sm">{user.messages_sent} messages sent</p>
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-400 font-semibold">{user.channels_participated}</div>
                      <div className="text-gray-500 text-xs">channels</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-8">No activity data</p>
              )}
            </div>
          </div>

          {/* Top Channels */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Channels</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {channelEngagement.length > 0 ? (
                channelEngagement.map((channel, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
                    <div>
                      <p className="text-white font-medium">#{channel.name}</p>
                      <p className="text-gray-400 text-sm">{channel.unique_users} members active</p>
                    </div>
                    <div className="text-right">
                      <div className="text-purple-400 font-semibold">{channel.message_count}</div>
                      <div className="text-gray-500 text-xs">messages</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-8">No channel data</p>
              )}
            </div>
          </div>
        </div>

        {/* Department Performance */}
        {department.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Department Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {department.map((dept, idx) => (
                <div key={idx} className="p-4 bg-gray-700/50 rounded border border-gray-600">
                  <h4 className="text-white font-semibold mb-3">{dept.name}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Employees</span>
                      <span className="text-white">{dept.employee_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Messages</span>
                      <span className="text-purple-400">{dept.messages_sent || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg Attendance</span>
                      <span className="text-green-400">{dept.avg_attendance?.toFixed(1) || 0}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="text-center text-gray-500 text-sm">
          <p>Last updated: {new Date().toLocaleString()}</p>
          <p>Data is refreshed automatically every 5 minutes</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
