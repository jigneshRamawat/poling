const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    pollId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    optionId: {
      type: String,
      required: true,
      trim: true,
    },
    voterId: {
      type: String,
      required: true,
      trim: true,
    },
    optionalName: {
      type: String,
      default: '',
      trim: true,
      maxlength: [100, 'नाम 100 वर्णों से अधिक नहीं हो सकता'],
    },
  },
  {
    timestamps: true,
    collection: 'votes',
  }
);

// Enforce one vote per poll per browser voter ID
voteSchema.index({ pollId: 1, voterId: 1 }, { unique: true });

const Vote = mongoose.model('Vote', voteSchema);

module.exports = Vote;
