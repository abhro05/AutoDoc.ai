import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    default: null,
  },
  supabaseId: {
    type: String,
    default: null,
    sparse: true,
  },
  avatarUrl: {
    type: String,
    default: null,
  },
  authProvider: {
    type: String,
    enum: ['email', 'google', 'github'],
    default: 'email',
  },
  //  ADD THESE TWO FIELDS FOR FORGOT PASSWORD
  resetToken: {
    type: String,
    default: null
  },
  resetTokenExpiry: {
    type: Date,
    default: null
  },
  bio: {
    type: String,
    default: '',
    maxlength: 200,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('User', userSchema);