import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calendar, Download } from 'lucide-react';

const AnalyticsCharts = () => {
  const [chartData, setChartData] = useState({
    messageTrend: [],
    inventoryTrend: [],
    attendanceTrend: [],
    departmentData: []
  });
  const [dateRange, setDateRange] = useState('month');
  const [loading, setLoading] = useState(true);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [
        messageRes,
        inventoryRes,
        attendanceRes
      ] = await Promise.all([
        fetch(`/api/analytics/message-trend?days=${dateRange === 'month' ? 30 : dateRange === 'week' ? 7 : 365}`, { headers }),
        fetch(`/api/analytics/inventory-trend?days=${dateRange === 'month' ? 30 : dateRange === 'week' ? 7 : 365}`, { headers }),
        fetch(`/api/analytics/attendance-trend?days=${dateRange === 'month' ? 30 : dateRange === 'week' ? 7 : 365}`, { headers })
      ]);

      const messageTrend = await messageRes.json();
      const inventoryTrend = await inventoryRes.json();
      const attendanceTrend = await attendanceRes.json();

      setChartData({
        messageTrend: messageTrend.data || [],
        inventoryTrend: inventoryTrend.data || [],
        attendanceTrend: attendanceTrend.data || [],
        departmentData: []
      });
    } catch (error) {
      console.error('Chart data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [dateRange]);

  // Simple bar chart component
  const BarChart = ({ data, dataKey, title, color = '#10b981' }) => {
    if (!data || data.length === 0) {
      return <div className="text-gray-400 text-center py-8">No data available</div>;
    }

    const maxValue = Math.max(...data.map(d => d[dataKey] || 0), 1);
    const scaleFactor = 100 / maxValue;

    return (
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="space-y-3">
          {data.slice(-7).reverse().map((item, idx) => {
            const value = item[dataKey] || 0;
            const displayDate = item.date || new Date().toLocaleDateString();
            return (
              <div key={idx} className="flex items-end gap-3">
                <div className="w-20 text-right">
                  <p className="text-gray-400 text-xs">{displayDate}</p>
                  <p className="text-white font-semibold text-sm">{value}</p>
                </div>
                <div className="flex-1 bg-gray-700 h-8 rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-300"
                    style={{
                      width: `${value * scaleFactor}%`,
                      backgroundColor: color
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Line chart component (simplified)
  const LineChart = ({ data, dataKey, title, color = '#3b82f6' }) => {
    if (!data || data.length === 0) {
      return <div className="text-gray-400 text-center py-8">No data available</div>;
    }

    const maxValue = Math.max(...data.map(d => d[dataKey] || 0), 1);
    const points = data.map((item, idx) => ({
      x: (idx / (data.length - 1 || 1)) * 100,
      y: 100 - ((item[dataKey] || 0) / maxValue * 100),
      value: item[dataKey] || 0,
      date: item.date
    }));

    const pathData = points
      .map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

    return (
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="bg-gray-700/30 rounded-lg p-4 overflow-x-auto">
          <svg viewBox="0 0 100 100" className="w-full h-48 min-w-max" preserveAspectRatio="xMidYMid meet">
            {/* Grid */}
            {[0, 25, 50, 75, 100].map(y => (
              <line key={`grid-${y}`} x1="0" y1={y} x2="100" y2={y} stroke="rgba(156, 163, 175, 0.1)" strokeWidth="0.5" />
            ))}
            {/* Line */}
            <polyline
              points={points.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={color}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            {/* Points */}
            {points.map((point, idx) => (
              <circle
                key={`point-${idx}`}
                cx={point.x}
                cy={point.y}
                r="1.5"
                fill={color}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Start</p>
            <p className="text-white font-semibold">{points[0]?.value || 0}</p>
          </div>
          <div>
            <p className="text-gray-400">End</p>
            <p className="text-white font-semibold">{points[points.length - 1]?.value || 0}</p>
          </div>
          <div>
            <p className="text-gray-400">Min</p>
            <p className="text-white font-semibold">{Math.min(...points.map(p => p.value))}</p>
          </div>
          <div>
            <p className="text-gray-400">Max</p>
            <p className="text-white font-semibold">{Math.max(...points.map(p => p.value))}</p>
          </div>
        </div>
      </div>
    );
  };

  // Stacked bar chart
  const StackedBarChart = ({ data, title }) => {
    if (!data || data.length === 0) {
      return <div className="text-gray-400 text-center py-8">No data available</div>;
    }

    return (
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="space-y-4">
          {data.slice(-7).reverse().map((item, idx) => {
            const total = (item.present_count || 0) + (item.absent_count || 0) + (item.late_count || 0) + (item.leave_count || 0) || 1;
            const presentPct = ((item.present_count || 0) / total) * 100;
            const latePct = ((item.late_count || 0) / total) * 100;
            const leavePct = ((item.leave_count || 0) / total) * 100;
            const absentPct = ((item.absent_count || 0) / total) * 100;

            return (
              <div key={idx}>
                <div className="flex justify-between mb-2">
                  <p className="text-gray-400 text-sm">{item.date}</p>
                  <p className="text-white text-sm font-semibold">{total} total</p>
                </div>
                <div className="flex h-6 rounded overflow-hidden gap-0.5">
                  {presentPct > 0 && (
                    <div className="bg-green-500" style={{ width: `${presentPct}%` }} title={`Present: ${item.present_count}`}></div>
                  )}
                  {latePct > 0 && (
                    <div className="bg-yellow-500" style={{ width: `${latePct}%` }} title={`Late: ${item.late_count}`}></div>
                  )}
                  {leavePct > 0 && (
                    <div className="bg-blue-500" style={{ width: `${leavePct}%` }} title={`Leave: ${item.leave_count}`}></div>
                  )}
                  {absentPct > 0 && (
                    <div className="bg-red-500" style={{ width: `${absentPct}%` }} title={`Absent: ${item.absent_count}`}></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 grid grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-400">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-gray-400">Late</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-400">Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-400">Absent</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-300">Loading charts...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Analytics Charts</h1>
            <p className="text-gray-400">Visual representation of company metrics</p>
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-emerald-500 text-white rounded-lg focus:outline-none"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Message Trend Line Chart */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <LineChart
              data={chartData.messageTrend}
              dataKey="message_count"
              title="Message Activity Trend"
              color="#a78bfa"
            />
          </div>

          {/* Inventory Movement Bar Chart */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <BarChart
              data={chartData.inventoryTrend}
              dataKey="additions"
              title="Inventory Additions"
              color="#10b981"
            />
          </div>

          {/* Inventory Removals */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <BarChart
              data={chartData.inventoryTrend}
              dataKey="removals"
              title="Inventory Removals"
              color="#ef4444"
            />
          </div>

          {/* Active Users Trend */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <LineChart
              data={chartData.messageTrend}
              dataKey="unique_users"
              title="Active Users Trend"
              color="#3b82f6"
            />
          </div>

          {/* Active Channels Trend */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <BarChart
              data={chartData.messageTrend}
              dataKey="active_channels"
              title="Active Channels"
              color="#f59e0b"
            />
          </div>

          {/* Attendance Status Breakdown */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <StackedBarChart
              data={chartData.attendanceTrend}
              title="Attendance Breakdown"
            />
          </div>
        </div>

        {/* Data Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">Message Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Messages</span>
                <span className="text-emerald-400 font-semibold">
                  {chartData.messageTrend.reduce((sum, d) => sum + (d.message_count || 0), 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg Per Day</span>
                <span className="text-emerald-400 font-semibold">
                  {Math.round(
                    chartData.messageTrend.reduce((sum, d) => sum + (d.message_count || 0), 0) /
                    (chartData.messageTrend.length || 1)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Trend</span>
                <span className="flex items-center gap-1">
                  {chartData.messageTrend.length > 1 && 
                    chartData.messageTrend[chartData.messageTrend.length - 1].message_count > 
                    chartData.messageTrend[0].message_count ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-semibold">↑</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 font-semibold">↓</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">Inventory Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Additions</span>
                <span className="text-green-400 font-semibold">
                  {chartData.inventoryTrend.reduce((sum, d) => sum + (d.additions || 0), 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Removals</span>
                <span className="text-red-400 font-semibold">
                  {chartData.inventoryTrend.reduce((sum, d) => sum + (d.removals || 0), 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Net Movement</span>
                <span className={`font-semibold ${
                  (chartData.inventoryTrend.reduce((sum, d) => sum + (d.additions || 0), 0) -
                   chartData.inventoryTrend.reduce((sum, d) => sum + (d.removals || 0), 0)) > 0
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}>
                  {chartData.inventoryTrend.reduce((sum, d) => sum + (d.additions || 0), 0) -
                   chartData.inventoryTrend.reduce((sum, d) => sum + (d.removals || 0), 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">Attendance Stats</h3>
            <div className="space-y-3">
              {chartData.attendanceTrend.length > 0 ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Latest Present</span>
                    <span className="text-green-400 font-semibold">
                      {chartData.attendanceTrend[chartData.attendanceTrend.length - 1].present_count}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Latest Absent</span>
                    <span className="text-red-400 font-semibold">
                      {chartData.attendanceTrend[chartData.attendanceTrend.length - 1].absent_count}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Latest On Leave</span>
                    <span className="text-blue-400 font-semibold">
                      {chartData.attendanceTrend[chartData.attendanceTrend.length - 1].leave_count}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-sm">No attendance data</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Charts updated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
