import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTaskData } from '../../hooks/useTaskData';
import { 
  CheckSquare, 
  Clock, 
  ExternalLink,
  FileText,
  Link2,
  Upload,
  Check
} from 'lucide-react';

export const TaskList: React.FC = () => {
  const { user } = useAuth();

  // Don't render tasks for pending users
  if (user?.status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md mx-auto p-6 pt-20">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="h-10 w-10 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Account Pending Approval</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Your registration is under review. Please complete payment for Package {user.package}
              (KES {user.packagePrice.toLocaleString()}) and wait for admin approval to access your tasks.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { userTasks, tasks, submissions, submitTask } = useTaskData(user);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [submissionData, setSubmissionData] = useState({
    content: '',
    proof: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmission = async (taskId: string) => {
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    setIsSubmitting(true);
    try {
      await submitTask(taskId, {
        type: task.type,
        content: submissionData.content,
        proof: submissionData.proof,
      });
      setSelectedTask(null);
      setSubmissionData({ content: '', proof: '' });
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTaskStatus = (userTask: any) => {
    const submission = submissions.find(s => s.taskId === userTask.taskId);
    if (submission) {
      return submission.status;
    }
    return userTask.status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'text':
        return FileText;
      case 'link':
        return Link2;
      case 'file':
        return Upload;
      default:
        return CheckSquare;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Available Tasks</h1>
        <p className="text-gray-600">Complete your daily tasks to earn rewards</p>
      </div>

      <div className="space-y-4">
        {userTasks.map((userTask) => {
          const task = tasks.find(t => t._id === userTask.taskId);
          if (!task) return null;

          const status = getTaskStatus(userTask);
          const TaskIcon = getTaskIcon(task.type);
          const isCompleted = status === 'completed' || status === 'approved';
          const canComplete = status === 'assigned' && new Date() <= new Date(userTask.dueDate);

          return (
            <div key={userTask._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${isCompleted ? 'bg-emerald-50' : 'bg-blue-50'}`}>
                      <TaskIcon className={`h-6 w-6 ${isCompleted ? 'text-emerald-600' : 'text-blue-600'}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{task.title}</h3>
                      <p className="text-gray-600 mb-3">{task.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{task.estimatedTime} min</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="font-medium">Reward: KES {task.reward}</span>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          task.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          task.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {task.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                      {status === 'assigned' ? 'Available' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      Due: {new Date(userTask.dueDate).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Task Instructions */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Instructions:</h4>
                  <p className="text-sm text-gray-700">{task.instructions}</p>
                </div>

                {/* Action Buttons */}
                {canComplete && selectedTask !== userTask._id && (
                  <button
                    onClick={() => setSelectedTask(userTask._id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    Start Task
                  </button>
                )}

                {isCompleted && (
                  <div className="flex items-center justify-center py-3 text-emerald-600">
                    <Check className="h-5 w-5 mr-2" />
                    <span className="font-medium">Task Completed</span>
                  </div>
                )}

                {/* Submission Form */}
                {selectedTask === userTask._id && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-gray-900 mb-3">Submit Your Work</h4>
                    
                    <div className="space-y-4">
                      {task.type === 'text' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Your Response
                          </label>
                          <textarea
                            value={submissionData.content}
                            onChange={(e) => setSubmissionData({ ...submissionData, content: e.target.value })}
                            rows={4}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Write your detailed response here..."
                          />
                        </div>
                      )}

                      {task.type === 'link' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Proof Link
                          </label>
                          <input
                            type="url"
                            value={submissionData.content}
                            onChange={(e) => setSubmissionData({ ...submissionData, content: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="https://example.com/your-proof"
                          />
                        </div>
                      )}

                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleSubmission(userTask.taskId)}
                          disabled={isSubmitting || !submissionData.content}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Task'}
                        </button>
                        <button
                          onClick={() => setSelectedTask(null)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {userTasks.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <CheckSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks Available</h3>
          <p className="text-gray-600">New tasks will be assigned at midnight</p>
        </div>
      )}
    </div>
  );
};