import mongoose from 'mongoose';

const userTaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  assignedDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['assigned', 'completed', 'approved', 'rejected', 'expired'],
    default: 'assigned'
  },
  submissionData: {
    proofText: String,
    proofLink: String,
    proofFile: String,
    submittedAt: Date
  },
  reviewData: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    rejectionReason: String
  },
  earningAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
userTaskSchema.index({ userId: 1, assignedDate: 1 });
userTaskSchema.index({ status: 1, dueDate: 1 });

export default mongoose.model('UserTask', userTaskSchema);