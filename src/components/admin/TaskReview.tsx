import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  User,
  FileText,
  Link,
  Upload,
  AlertTriangle,
  Search
} from 'lucide-react';
import axios from 'axios';

interface TaskSubmission {
  _id: string;
  userId: {
    firstName: string;
    lastName: string;
    email: string;
  };
  taskId: {
    title: string;
    description: string;
    reward: number;
    requiredProofType: string;
  };
  submissionData: {
    proofText?: string;
    proofLink?: string;
    proofFile?: string;
    submittedAt: string;
  };
  status: string;
  reviewData?: {
    reviewedBy: {
      firstName: string;
      lastName: string;
    };
    reviewedAt: string;
    rejectionReason?: string;
  };
}

export const TaskReview: React.FC = () => {
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<TaskSubmission | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const baseURL = import.meta.env.VITE_API_URL || 'https://crediwork.onrender.com';

  useEffect(() => {
    fetchSubmissions();
  }, [currentPage]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(`${baseURL}/api/admin/task-submissions?page=${currentPage}&limit=10`, { headers });
      setSubmissions(response.data.submissions);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedSubmission) return;

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const reviewData = {
        action: reviewAction,
        ...(reviewAction === 'reject' && { rejectionReason })
      };

      await axios.put(`${baseURL}/api/admin/task-submissions/${selectedSubmission._id}`, reviewData, { headers });

      setShowReviewModal(false);
      setSelectedSubmission(null);
      setRejectionReason('');
      fetchSubmissions(); // Refresh the list
    } catch (error) {
      console.error('Error reviewing submission:', error);
      alert('Failed to review submission');
    }
  };

  const openReviewModal = (submission: TaskSubmission, action: 'approve' | 'reject') => {
    setSelectedSubmission(submission);
    setReviewAction(action);
    setShowReviewModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProofIcon = (proofType: string | undefined) => {
    switch (proofType) {
      case 'text':
        return FileText;
      case 'link':
        return Link;
      case 'file':
      case 'image':
        return Upload;
      default:
        return FileText;
    }
  };

  const filteredSubmissions = submissions.filter(submission =>
    submission.userId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.userId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.userId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.taskId.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Review</h1>
          <p className="text-gray-600">Review and approve user task submissions</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search submissions by user or task..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading submissions...</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions Found</h3>
          <p className="text-gray-600">All task submissions have been reviewed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => {
            const ProofIcon = getProofIcon(submission.taskId.requiredProofType);

            return (
              <div key={submission._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{submission.taskId.title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status || '')}`}>
                          {(submission.status || '').charAt(0).toUpperCase() + (submission.status || '').slice(1)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{submission.userId.firstName} {submission.userId.lastName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>Submitted {(submission.submissionData && submission.submissionData.submittedAt) ? new Date(submission.submissionData.submittedAt).toLocaleDateString() : 'Unknown'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="font-medium">Reward: KES {submission.taskId.reward}</span>
                        </div>
                      </div>

                      {/* Submission Content */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <ProofIcon className="h-5 w-5 text-gray-600" />
                        <span className="font-medium text-gray-900">
                          {(submission.taskId.requiredProofType ? submission.taskId.requiredProofType.charAt(0).toUpperCase() + submission.taskId.requiredProofType.slice(1) : 'Unknown')} Proof
                        </span>
                        </div>

                        {submission.taskId.requiredProofType === 'text' && submission.submissionData.proofText && (
                          <p className="text-gray-700">{submission.submissionData.proofText}</p>
                        )}

                        {submission.taskId.requiredProofType === 'link' && submission.submissionData.proofLink && (
                          <a
                            href={submission.submissionData.proofLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {submission.submissionData.proofLink}
                          </a>
                        )}

                        {(submission.taskId.requiredProofType === 'file' || submission.taskId.requiredProofType === 'image') && submission.submissionData.proofFile && (
                          <div className="text-gray-700">
                            File submitted: {submission.submissionData.proofFile}
                          </div>
                        )}
                      </div>

                      {/* Review Information */}
                      {submission.reviewData && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-900">
                              Reviewed by {submission.reviewData.reviewedBy.firstName} {submission.reviewData.reviewedBy.lastName}
                            </span>
                            <span className="text-sm text-blue-600">
                              on {new Date(submission.reviewData.reviewedAt).toLocaleDateString()}
                            </span>
                          </div>

                          {submission.reviewData.rejectionReason && (
                            <div className="mt-2 p-3 bg-red-50 rounded border border-red-200">
                              <div className="flex items-center space-x-2 mb-1">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <span className="font-medium text-red-900">Rejection Reason:</span>
                              </div>
                              <p className="text-red-800">{submission.reviewData.rejectionReason}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {submission.status === 'completed' && (
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => openReviewModal(submission, 'approve')}
                          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => openReviewModal(submission, 'reject')}
                          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 border rounded-lg ${
                  page === currentPage
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Task Submission
            </h3>

            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                <strong>Task:</strong> {selectedSubmission.taskId.title}
              </p>
              <p className="text-gray-600 mb-2">
                <strong>User:</strong> {selectedSubmission.userId.firstName} {selectedSubmission.userId.lastName}
              </p>
              <p className="text-gray-600">
                <strong>Reward:</strong> KES {selectedSubmission.taskId.reward}
              </p>
            </div>

            {reviewAction === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Please provide a reason for rejection..."
                  required
                />
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={reviewAction === 'reject' && !rejectionReason.trim()}
                className={`px-4 py-2 text-white rounded-lg ${
                  reviewAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {reviewAction === 'approve' ? 'Approve' : 'Reject'} Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
