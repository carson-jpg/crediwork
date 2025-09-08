import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  package: {
    type: String,
    enum: ['A', 'B'],
    required: function() {
      return this.role === 'user';
    }
  },
  packageAmount: {
    type: Number,
    required: function() {
      return this.role === 'user';
    }
  },
  dailyEarning: {
    type: Number,
    required: function() {
      return this.role === 'user';
    }
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'banned'],
    default: 'pending'
  },
  activationDate: {
    type: Date,
    default: null
  },
  paymentProof: {
    type: String,
    default: null
  },
  kycData: {
    idNumber: String,
    mpesaPhone: String,
    verified: {
      type: Boolean,
      default: false
    }
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  deviceFingerprint: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateReferralCode = function() {
  return `CW${this._id.toString().slice(-6).toUpperCase()}`;
};

export default mongoose.model('User', userSchema);