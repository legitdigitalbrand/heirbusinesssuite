import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import MainLayout from '../../components/layouts/MainLayout';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/employee/profile');
      setProfile(response.data.data);
      setFormData(response.data.data);
    } catch (error) {
      toast.error('Failed to load profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/api/employee/profile', formData);
      toast.success('Profile updated successfully');
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  return (
    <MainLayout>
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Personal Information</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="first_name"
                  placeholder="First Name"
                  value={formData.first_name || ''}
                  onChange={handleChange}
                  className="col-span-1 px-4 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  name="last_name"
                  placeholder="Last Name"
                  value={formData.last_name || ''}
                  onChange={handleChange}
                  className="col-span-1 px-4 py-2 border rounded-lg"
                />
              </div>

              <input
                type="email"
                value={formData.email || ''}
                disabled
                className="w-full px-4 py-2 border rounded-lg bg-gray-100"
              />

              <input
                type="tel"
                name="phone"
                placeholder="Phone"
                value={formData.phone || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
              />

              <input
                type="text"
                name="address"
                placeholder="Address"
                value={formData.address || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city || ''}
                  onChange={handleChange}
                  className="px-4 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  name="country"
                  placeholder="Country"
                  value={formData.country || ''}
                  onChange={handleChange}
                  className="px-4 py-2 border rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
              >
                Save Changes
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">First Name</p>
                  <p className="font-medium">{profile?.first_name || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Last Name</p>
                  <p className="font-medium">{profile?.last_name || '-'}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-600 text-sm">Email</p>
                <p className="font-medium">{profile?.email || '-'}</p>
              </div>

              <div>
                <p className="text-gray-600 text-sm">Position</p>
                <p className="font-medium">{profile?.position || '-'}</p>
              </div>

              <div>
                <p className="text-gray-600 text-sm">Employment Type</p>
                <p className="font-medium">{profile?.employment_type || '-'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Phone</p>
                  <p className="font-medium">{profile?.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Date of Joining</p>
                  <p className="font-medium">
                    {profile?.date_of_joining ? new Date(profile.date_of_joining).toLocaleDateString() : '-'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
