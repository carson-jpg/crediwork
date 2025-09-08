import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  User,
  Search,
  Check,
  Calendar,
  Clock,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  package: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  reward: number;
  estimatedTime: number;
  category: string;
}

export const TaskAssign: React.FC = () => {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    if (taskId) {
      fetchTask();
      fetchUsers();
    }
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(`${baseURL}/api/admin/tasks/${taskId}`, { headers });
      setTask(response.data);
    } catch (error) {
      console.error('Error fetching task:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(`${baseURL}/api/admin/users?status=active&limit=1000`, { headers });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user._id));
    }
  };

  const handleAssign = async () => {
    if (!taskId || selectedUsers.length === 0 || !dueDate) {
      alert('Please select users and set a due date');
      return;
    }

    try {
      setAssigning(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post(`${baseURL}/api/admin/tasks/${taskId}/assign`, {
        userIds: selectedUsers,
        dueDate
      }, { headers });

      setShowSuccess(true);
      setTimeout(() => {
        navigate('/admin/tasks');
      }, 2000);
    } catch (error) {
      console.error('Error assigning task:', error);
      alert('Failed to assign task. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPackageColor = (packageType: string) => {
    return packageType === 'A' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/tasks')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assign Task</h1>
            <p className="text-gray-600">Assign task to users</p>
          </div>
        </div>
      </div>

      {/* Task Info */}
      {task && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h2>
          <p className="text-gray-600 mb-4">{task.description}</p>

          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{task.estimatedTime} minutes</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="font-medium">Reward: KES {task.reward}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>Category: {task.category.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Selection */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Select Users</h3>
                <span className="text-sm text-gray-600">
                  {selectedUsers.length} of {filteredUsers.length} selected
                </span>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Select All */}
              <div className="flex items-center space-x-3 mb-4">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                >
                  <Check className="h-4 w-4" />
                  <span>{selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}</span>
                </button>
              </div>
            </div>

            {/* Users List */}
            <div className="max-h-96 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No users found
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => handleUserSelect(user._id)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedUsers.includes(user._id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedUsers.includes(user._id)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {selectedUsers.includes(user._id) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </h4>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPackageColor(user.package)}`}>
                              Package {user.package}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assignment Settings */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Settings</h3>

            {/* Due Date */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <div className="relative">
                <Calendar className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Assignment Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Selected Users:</span>
                  <span className="font-medium">{selectedUsers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Task Reward:</span>
                  <span className="font-medium">KES {task?.reward || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Value:</span>
                  <span className="font-medium text-green-600">
                    KES {(selectedUsers.length * (task?.reward || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {selectedUsers.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm text-yellow-800">Please select at least one user</span>
                </div>
              </div>
            )}

            {!dueDate && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm text-yellow-800">Please set a due date</span>
                </div>
              </div>
            )}

            {/* Assign Button */}
            <button
              onClick={handleAssign}
              disabled={assigning || selectedUsers.length === 0 || !dueDate}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {assigning ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Users className="h-5 w-5" />
              )}
              <span>{assigning ? 'Assigning...' : 'Assign Task'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Task Assigned Successfully!</h3>
            <p className="text-gray-600 mb-4">
              Task has been assigned to {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''}.
            </p>
            <button
              onClick={() => navigate('/admin/tasks')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
            >
              Return to Tasks
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
