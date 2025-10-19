import mongoose from 'mongoose';

const EventLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  videoId: {
    type: String,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.EventLog || mongoose.model('EventLog', EventLogSchema);
