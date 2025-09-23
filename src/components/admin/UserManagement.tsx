import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Eye,
  UserCheck,
  UserX,
  Mail
} from 'lucide-react';
import axios from 'axios';
import UserDetailsModal from './UserDetailsModal';

export const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [users, setUsers] = useState<any[]>([]);
  const [currentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, filterStatus, currentPage]);

  const fetchUsers = async () => {
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://crediwork.onrender.com';
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const params = new URLSearchParams({
        status: filterStatus,
        search: searchTerm,
        page: currentPage.toString(),
        limit: '10'
      });

      const response = await axios.get(`${baseURL}/api/admin/users?${params}`, { headers });

      // Transform the data to match the expected format
      const transformedUsers = response.data.users.map((user: any) => ({
        _id: user._id,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,
        package: user.package,
        status: user.status,
        totalEarned: user.totalEarned || 0,
        activationDate: user.activationDate ? new Date(user.activationDate) : null,
        createdAt: new Date(user.createdAt),
      }));

      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUserAction = async (userId: string, action: string) => {
    console.log('handleUserAction called:', { userId, action });

    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://crediwork.onrender.com';
      const token = localStorage.getItem('token');
      console.log('Auth token present:', !!token);

      const headers = {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      };

      if (action === 'approve') {
        console.log('Making approve request to:', `${baseURL}/api/admin/users/${userId}/approve`);
        const response = await axios.put(`${baseURL}/api/admin/users/${userId}/approve`, {}, { headers });
        console.log('Approve response:', response);

        if (response.status === 200) {
          console.log('User approved successfully, updating UI');
          setUsers((prevUsers) =>
            prevUsers.map((user) =>
              user._id === userId ? { ...user, status: 'active', activationDate: new Date() } : user
            )
          );
        }
      } else if (action === 'reject') {
        // For simplicity, reject without reason prompt
        console.log('Making reject request to:', `${baseURL}/api/admin/users/${userId}/reject`);
        const response = await axios.put(`${baseURL}/api/admin/users/${userId}/reject`, { reason: 'Rejected by admin' }, { headers });
        console.log('Reject response:', response);

        if (response.status === 200) {
          console.log('User rejected successfully, updating UI');
          setUsers((prevUsers) =>
            prevUsers.map((user) =>
              user._id === userId ? { ...user, status: 'rejected' } : user
            )
          );
        }
      } else if (action === 'suspend') {
        // Implement suspend if needed
      } else if (action === 'view') {
        // Implement view details
        console.log('Opening user details modal for user:', userId);
        setSelectedUserId(userId);
        setIsModalOpen(true);
      } else if (action === 'email') {
        // Implement send email if needed
      }
    } catch (error: any) {
      console.error('User action error:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Optionally show error feedback to user
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUserId(null);
  };

  // Users are now filtered server-side, so we use the fetched users directly
  const filteredUsers = users;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage user accounts and monitor activity</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
            Export Users
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Package
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Earned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {user.fullName.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.package === 'A' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      Package {user.package}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    KES {user.totalEarned.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUserAction(user._id, 'view')}
                        className="text-blue-600 hover:text-blue-700 p-1 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {user.status === 'pending' && (
                        <button
                          onClick={() => handleUserAction(user._id, 'approve')}
                          className="text-emerald-600 hover:text-emerald-700 p-1 rounded transition-colors"
                          title="Approve User"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                      )}
                      
                      {user.status === 'active' && (
                        <button
                          onClick={() => handleUserAction(user._id, 'suspend')}
                          className="text-red-600 hover:text-red-700 p-1 rounded transition-colors"
                          title="Suspend User"
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleUserAction(user._id, 'email')}
                        className="text-gray-600 hover:text-gray-700 p-1 rounded transition-colors"
                        title="Send Email"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* User Details Modal */}
      <UserDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        userId={selectedUserId}
      />
    </div>
  );
};
