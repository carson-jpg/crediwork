import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processing', 'completed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'bank_transfer'],
    default: 'mpesa'
  },
  paymentDetails: {
    mpesaPhone: String,
    bankAccount: String,
    bankName: String
  },
  adminNotes: {
    type: String,
    default: ''
  },
  payoutReference: {
    type: String,
    default: null
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model('Withdrawal', withdrawalSchema);