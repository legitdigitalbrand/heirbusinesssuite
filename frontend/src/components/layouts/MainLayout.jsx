import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaSignOutAlt, FaBell, FaUserCircle, FaMenu } from 'react-icons/fa';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
      logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-emerald-800 text-white transition-all duration-300 overflow-hidden`}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold">Heirs Suite</h1>
        </div>
        <nav className="mt-8 space-y-2">
          <NavLink to="/dashboard" icon="📊">
            Dashboard
          </NavLink>
          <NavLink to="/attendance" icon="⏰">
            Attendance
          </NavLink>
          <NavLink to="/profile" icon="👤">
            My Profile
          </NavLink>
          <NavLink to="/chat" icon="💬">
            Chat
          </NavLink>
          <NavLink to="/documents" icon="📄">
            Documents
          </NavLink>
          <NavLink to="/admin/hr" icon="👥" adminOnly>
            HR Management
          </NavLink>
          <NavLink to="/admin/inventory" icon="📦" adminOnly>
            Inventory
          </NavLink>
          <NavLink to="/admin/settings" icon="⚙️" adminOnly>
            Settings
          </NavLink>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <div className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FaMenu className="text-gray-700" size={20} />
          </button>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                <FaBell className="text-gray-700" size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3 border-l pl-4">
              <FaUserCircle className="text-emerald-600" size={24} />
              <div className="text-sm">
                <p className="font-medium">{user?.firstName}</p>
                <p className="text-gray-500 text-xs">Employee</p>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
              title="Logout"
            >
              <FaSignOutAlt size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gray-50 p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function NavLink({ to, icon, children, adminOnly }) {
  return (
    <Link
      to={to}
      className="flex items-center px-4 py-3 hover:bg-emerald-700 rounded-lg transition-colors"
    >
      <span className="mr-3 text-xl">{icon}</span>
      <span>{children}</span>
    </Link>
  );
}
