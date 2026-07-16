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
const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true, 
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true, 
    },
    password: {
      type: String,
      default: null,
    },
    supabaseId: {
      type: String,
      default: null,
      sparse: true,
      trim: true, 
    },
    avatarUrl: {
      type: String,
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return urlRegex.test(v);
        },
        message: (props) => `${props.value} is not a valid URL`,
      },
    },
    authProvider: {
      type: String,
      enum: ['email', 'google', 'github'],
      default: 'email',
    },
    resetToken: {
      type: String,
      default: null,
    },
    resetTokenExpiry: {
      type: Date,
      default: null,
      index: true, 
    },
  
  },
  {
    timestamps: true, 
  }
);

export default mongoose.model('User', userSchema);