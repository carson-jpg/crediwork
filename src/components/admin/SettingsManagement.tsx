import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Filter,
  Search
} from 'lucide-react';

interface Setting {
  _id: string;
  key: string;
  value: string;
  description: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export const SettingsManagement: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    description: '',
    category: ''
  });

  const baseURL = import.meta.env.VITE_API_URL || 'https://crediwork.onrender.com';

  useEffect(() => {
    fetchSettings();
  }, [selectedCategory]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(
        `${baseURL}/api/admin/settings${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`,
        { headers }
      );

      setSettings(response.data.settings || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to fetch settings');
      setSettings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.key || !formData.value || !formData.category) {
      setError('Key, value, and category are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (editingSetting) {
        // Update existing setting
        await axios.put(
          `${baseURL}/api/admin/settings/${editingSetting._id}`,
          formData,
          { headers }
        );
      } else {
        // Create new setting
        await axios.post(
          `${baseURL}/api/admin/settings`,
          formData,
          { headers }
        );
      }

      setShowAddModal(false);
      setEditingSetting(null);
      setFormData({ key: '', value: '', description: '', category: '' });
      fetchSettings();
    } catch (err: any) {
      console.error('Error saving setting:', err);
      setError(err.response?.data?.error || 'Failed to save setting');
    }
  };

  const handleEdit = (setting: Setting) => {
    setEditingSetting(setting);
    setFormData({
      key: setting.key,
      value: setting.value,
      description: setting.description,
      category: setting.category
    });
    setShowAddModal(true);
  };

  const handleDelete = async (settingId: string) => {
    if (!window.confirm('Are you sure you want to delete this setting?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.delete(`${baseURL}/api/admin/settings/${settingId}`, { headers });
      fetchSettings();
    } catch (err) {
      console.error('Error deleting setting:', err);
      setError('Failed to delete setting');
    }
  };

  const handleCancel = () => {
    setShowAddModal(false);
    setEditingSetting(null);
    setFormData({ key: '', value: '', description: '', category: '' });
    setError(null);
  };

  const filteredSettings = settings.filter(setting =>
    setting.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    setting.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    setting.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = ['all', ...Array.from(new Set(settings.map(s => s.category)))];

  if (loading && settings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings Management</h1>
          <p className="text-gray-600">Configure system settings and preferences</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Setting
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search settings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Settings List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Settings className="h-5 w-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              Settings ({filteredSettings.length})
            </h2>
          </div>

          {filteredSettings.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No settings found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSettings.map((setting) => (
                <div key={setting._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900">{setting.key}</h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {setting.category}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{setting.description}</p>
                      <div className="bg-gray-100 rounded px-3 py-2 font-mono text-sm">
                        {setting.value}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Updated: {new Date(setting.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(setting)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit setting"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(setting._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete setting"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingSetting ? 'Edit Setting' : 'Add New Setting'}
                </h3>
                <button
                  onClick={handleCancel}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Key *
                  </label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., APP_NAME"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value *
                  </label>
                  <textarea
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Setting value"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief description of this setting"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select category</option>
                    <option value="general">General</option>
                    <option value="package">Package</option>
                    <option value="payment">Payment</option>
                    <option value="notification">Notification</option>
                    <option value="security">Security</option>
                    <option value="system">System</option>
                    <option value="task">Task</option>
                    <option value="withdrawal">Withdrawal</option>
                    <option value="referral">Referral</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-4 w-4 mr-2 inline" />
                    {editingSetting ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
