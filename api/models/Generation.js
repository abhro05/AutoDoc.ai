import mongoose from 'mongoose';

const generationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  repoUrl: {
    type: String,
    required: true,
  },
  repoOwner: {
    type: String,
    default: '',
  },
  repoName: {
    type: String,
    default: '',
  },
  customInstructions: {
    type: String,
    default: '',
    maxlength: 500,
  },
  markdown: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['completed', 'failed'],
    default: 'completed',
  },
  jobId: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

generationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Generation', generationSchema);
