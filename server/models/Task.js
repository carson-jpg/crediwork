import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['survey', 'social_media', 'content_review', 'data_entry', 'app_testing'],
    required: true
  },
  requiredProofType: {
    type: String,
    enum: ['text', 'link', 'file', 'image'],
    default: 'text'
  },
  instructions: {
    type: String,
    required: true
  },
  estimatedTime: {
    type: Number, // in minutes
    default: 15
  },
  reward: {
    type: Number,
    required: true,
    min: 0
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Task', taskSchema);