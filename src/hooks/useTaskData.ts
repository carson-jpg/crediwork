import { useState, useEffect } from 'react';
import { Task, TaskSubmission, UserTask, User } from '../types';

export const useTaskData = (user: User | null) => {
  const [userTasks, setUserTasks] = useState<UserTask[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Don't fetch task data for pending users
    if (user.status === 'pending') {
      setIsLoading(false);
      return;
    }

    const fetchTaskData = async () => {
      try {
        const token = localStorage.getItem('token');
        const baseURL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'https://crediwork.onrender.com');
        const response = await fetch(`${baseURL}/api/user/tasks`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch task data');
        }

        const data = await response.json();

        // Transform the data to match our expected format
        const transformedUserTasks: UserTask[] = data.userTasks.map((ut: any) => ({
          _id: ut._id,
          userId: ut.userId,
          taskId: ut.taskId._id,
          assignedDate: new Date(ut.assignedDate),
          dueDate: new Date(ut.dueDate),
          status: ut.status,
          submissionId: ut.submissionId,
        }));

        const transformedTasks: Task[] = data.userTasks.map((ut: any) => ({
          _id: ut.taskId._id,
          title: ut.taskId.title,
          description: ut.taskId.description,
          type: ut.taskId.type || 'text',
          reward: ut.taskId.reward,
          difficulty: ut.taskId.difficulty || 'easy',
          estimatedTime: ut.taskId.estimatedTime || 10,
          instructions: ut.taskId.instructions || '',
          validationRules: ut.taskId.validationRules || {},
          createdAt: new Date(ut.taskId.createdAt),
          isActive: ut.taskId.isActive !== false,
        }));

        const transformedSubmissions: TaskSubmission[] = data.submissions.map((sub: any) => ({
          _id: sub._id,
          userId: sub.userId,
          taskId: sub.taskId,
          submissionType: sub.submissionType || 'text',
          content: sub.content,
          proof: sub.proof,
          status: sub.status,
          submittedAt: new Date(sub.submittedAt),
          earnedAmount: sub.earnedAmount,
        }));

        setUserTasks(transformedUserTasks);
        setTasks(transformedTasks);
        setSubmissions(transformedSubmissions);
      } catch (err) {
        console.error('Error fetching task data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch task data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskData();
  }, [user]);

  const submitTask = async (taskId: string, submission: {
    type: 'text' | 'link' | 'file';
    content: string;
    proof?: string;
  }) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      const baseURL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'https://crediwork.onrender.com');
      const response = await fetch(`${baseURL}/api/user/tasks/${taskId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: submission.content,
          proof: submission.proof,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit task');
      }

      const data = await response.json();

      // Update local state
      const newSubmission: TaskSubmission = {
        _id: data.submission._id,
        userId: user._id,
        taskId,
        submissionType: submission.type,
        content: submission.content,
        proof: submission.proof,
        status: data.submission.status,
        submittedAt: new Date(),
        earnedAmount: data.submission.earnedAmount,
      };

      setSubmissions(prev => [...prev, newSubmission]);

      // Update user task status
      setUserTasks(prev =>
        prev.map(ut =>
          ut.taskId === taskId
            ? { ...ut, status: 'completed' as const, submissionId: newSubmission._id }
            : ut
        )
      );

      return data;
    } catch (err) {
      console.error('Error submitting task:', err);
      throw err;
    }
  };

  return {
    userTasks,
    tasks,
    submissions,
    isLoading,
    error,
    submitTask,
  };
};
