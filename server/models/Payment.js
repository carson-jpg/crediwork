import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  package: {
    type: String,
    enum: ['A', 'B'],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['mpesa'],
    default: 'mpesa'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  mpesaTransactionId: {
    type: String,
    default: null
  },
  mpesaReceiptNumber: {
    type: String,
    default: null
  },
  mpesaPhoneNumber: {
    type: String,
    default: null
  },
  merchantRequestId: {
    type: String,
    default: null
  },
  checkoutRequestId: {
    type: String,
    default: null
  },
  responseCode: {
    type: String,
    default: null
  },
  responseDescription: {
    type: String,
    default: null
  },
  callbackData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model('Payment', paymentSchema);
