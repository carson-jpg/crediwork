import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['package', 'withdrawal', 'task', 'system', 'referral'],
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Settings', settingsSchema);