import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  videoId: {
    type: String,
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
  },
  tags: [{
    type: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp on save
NoteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.Note || mongoose.model('Note', NoteSchema);
