import React, { useState } from 'react';
import { X, Send, Mail } from 'lucide-react';
import axios from 'axios';

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  userEmail?: string;
  userName?: string;
}

interface FormErrors {
  subject?: string;
  message?: string;
  general?: string;
}

const EMAIL_TEMPLATES = [
  { value: 'custom-email', label: 'Custom Email' },
  { value: 'payment-success', label: 'Payment Success' },
  { value: 'payment-failed', label: 'Payment Failed' },
  { value: 'withdrawal-submitted', label: 'Withdrawal Submitted' },
  { value: 'withdrawal-approved', label: 'Withdrawal Approved' },
  { value: 'withdrawal-rejected', label: 'Withdrawal Rejected' },
] as const;

export const SendEmailModal: React.FC<SendEmailModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  userName
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [template, setTemplate] = useState('custom-email');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (subject.length > 100) {
      newErrors.subject = 'Subject must be less than 100 characters';
    }

    if (!message.trim()) {
      newErrors.message = 'Message is required';
    } else if (message.length > 2000) {
      newErrors.message = 'Message must be less than 2000 characters';
    }

    if (!userId) {
      newErrors.general = 'User ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getErrorMessage = (error: any): string => {
    if (error.response?.status === 401) return 'Authentication failed. Please login again.';
    if (error.response?.status === 403) return 'Admin access required.';
    if (error.response?.status === 404) return 'User not found.';
    if (error.response?.status >= 500) return 'Server error. Please try again later.';
    return error.response?.data?.error || error.message || 'Failed to send email';
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrors({ general: message });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://crediwork.onrender.com';
      const token = localStorage.getItem('token');

      if (import.meta.env.DEV) {
        console.log('Sending email request:', {
          baseURL,
          userId,
          subject: subject.trim(),
          message: message.trim(),
          template
        });
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const response = await axios.post(
        `${baseURL}/api/admin/users/${userId}/send-email`,
        {
          subject: subject.trim(),
          message: message.trim(),
          template
        },
        { headers }
      );

      if (response.status === 200) {
        showNotification('Email sent successfully!', 'success');
        handleClose();
      }
    } catch (error: any) {
      console.error('Send email error:', error);
      const errorMessage = getErrorMessage(error);
      showNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSubject('');
    setMessage('');
    setTemplate('custom-email');
    setErrors({});
    setSuccessMessage('');
    onClose();
  };

  const handleInputChange = (setter: (value: string) => void, field: keyof FormErrors) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setter(e.target.value);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Send Custom Email</h2>
              <p className="text-sm text-gray-600">
                Send a personalized email to {userName || 'the user'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-600">{successMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient
                </label>
                <p className="text-sm text-gray-900">{userName || 'User'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <p className="text-sm text-gray-900">{userEmail || 'No email provided'}</p>
              </div>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={handleInputChange(setSubject, 'subject')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.subject ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter email subject..."
              required
              aria-label="Email subject"
              maxLength={100}
            />
            {errors.subject && (
              <p className="text-sm text-red-600 mt-1">{errors.subject}</p>
            )}
          </div>

          {/* Template Selection */}
          <div>
            <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-2">
              Email Template
            </label>
            <select
              id="template"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Email template selection"
            >
              {EMAIL_TEMPLATES.map((templateOption) => (
                <option key={templateOption.value} value={templateOption.value}>
                  {templateOption.label}
                </option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              id="message"
              value={message}
              onChange={handleInputChange(setMessage, 'message')}
              rows={8}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.message ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your message here..."
              required
              aria-label="Email message"
              maxLength={2000}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                You can use basic formatting. The message will be sent as plain text.
              </p>
              <p className="text-xs text-gray-400">
                {message.length}/2000
              </p>
            </div>
            {errors.message && (
              <p className="text-sm text-red-600 mt-1">{errors.message}</p>
            )}
          </div>

          {/* General Error Message */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !subject.trim() || !message.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send Email</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
