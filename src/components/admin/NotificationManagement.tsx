import React, { useState, useEffect } from 'react';
import { Send, Users, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
}

const NotificationManagement: React.FC = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sendToAll) {
      fetchUsers();
    }
  }, [sendToAll]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users?status=active&limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    setSuccess(null);

    if (!title.trim() || !message.trim()) {
      setError('Title and message are required');
      setSending(false);
      return;
    }

    if (!sendToAll && selectedUsers.length === 0) {
      setError('Please select at least one user');
      setSending(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          type,
          sendToAll,
          userIds: sendToAll ? undefined : selectedUsers
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Notification sent successfully to ${data.totalRecipients || 'all users'} users`);
        setTitle('');
        setMessage('');
        setSelectedUsers([]);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send notification');
      }
    } catch (err) {
      setError('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          You don't have permission to access this page.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notification Management</h1>
          <p className="text-gray-600">Send notifications to users</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter notification title"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter notification message"
                  required
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Type
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as 'info' | 'success' | 'warning' | 'error')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Recipients
                </label>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="sendToAll"
                      name="recipients"
                      checked={sendToAll}
                      onChange={() => setSendToAll(true)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="sendToAll" className="ml-2 flex items-center text-sm text-gray-700">
                      <Users className="h-4 w-4 mr-1" />
                      Send to all active users
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="sendToSelected"
                      name="recipients"
                      checked={!sendToAll}
                      onChange={() => setSendToAll(false)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="sendToSelected" className="ml-2 flex items-center text-sm text-gray-700">
                      <User className="h-4 w-4 mr-1" />
                      Send to selected users
                    </label>
                  </div>
                </div>
              </div>

              {!sendToAll && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Users ({selectedUsers.length} selected)
                  </label>
                  {loading ? (
                    <div className="text-center py-4 text-gray-500">Loading users...</div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
                      {users.map((user) => (
                        <div
                          key={user._id}
                          className="flex items-center p-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            id={`user-${user._id}`}
                            checked={selectedUsers.includes(user._id)}
                            onChange={() => handleUserToggle(user._id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor={`user-${user._id}`}
                            className="ml-3 flex-1 cursor-pointer"
                          >
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-green-800 text-sm">{success}</p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={sending}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? 'Sending...' : 'Send Notification'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NotificationManagement;
