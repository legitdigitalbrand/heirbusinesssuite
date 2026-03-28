import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import MainLayout from '../../components/layouts/MainLayout';

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/employee/dashboard');
      setDashboardData(response.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setSigningIn(true);
      await api.post('/api/employee/attendance/sign-in');
      toast.success('Signed in successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Sign-in failed');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setSigningIn(true);
      await api.post('/api/employee/attendance/sign-out');
      toast.success('Signed out successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Sign-out failed');
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  const { stats, todayStatus } = dashboardData || {};

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-600 mt-1">Here's your dashboard overview</p>
        </div>

        {/* Time Tracking Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Time Tracking</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Status</p>
              <p className="text-2xl font-bold text-emerald-600">
                {todayStatus?.signedIn ? '✓ Signed In' : '✗ Signed Out'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm">Today's Hours</p>
              <p className="text-2xl font-bold">{todayStatus?.totalHoursToday?.toFixed(2) || '0'} hrs</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm">Entries Today</p>
              <p className="text-2xl font-bold">{todayStatus?.entries?.length || 0}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSignIn}
              disabled={todayStatus?.signedIn || signingIn}
              className="flex-1 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              {signingIn ? 'Processing...' : 'Sign In'}
            </button>
            <button
              onClick={handleSignOut}
              disabled={!todayStatus?.signedIn || signingIn}
              className="flex-1 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              {signingIn ? 'Processing...' : 'Sign Out'}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="Total Employees" value={stats?.total_employees || 0} icon="👥" />
          <StatCard title="Present Today" value={stats?.employees_present_today || 0} icon="✓" />
          <StatCard title="New This Month" value={stats?.new_employees || 0} icon="⭐" />
          <StatCard title="Inventory Items" value={stats?.total_products || 0} icon="📦" />
          <StatCard title="Departments" value={stats?.departments_count || 0} icon="🏢" />
          <StatCard title="Notifications" value={stats?.pending_notifications || 0} icon="🔔" />
        </div>

        {/* Today's Entries */}
        {todayStatus?.entries && todayStatus.entries.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">Today's Log</h3>
            <div className="space-y-3">
              {todayStatus.entries.map((entry, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="text-sm text-gray-600">Entry {idx + 1}</p>
                    <p className="font-medium">
                      {new Date(entry.sign_in_time).toLocaleTimeString()} -{' '}
                      {entry.sign_out_time ? new Date(entry.sign_out_time).toLocaleTimeString() : 'Active'}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-emerald-600">
                    {entry.duration_minutes ? `${(entry.duration_minutes / 60).toFixed(2)}h` : 'Ongoing'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <p className="text-4xl">{icon}</p>
      </div>
    </div>
  );
}
