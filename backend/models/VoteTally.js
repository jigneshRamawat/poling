const mongoose = require('mongoose');

const voteTallySchema = new mongoose.Schema(
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
    optionName: {
      type: String,
      required: true,
      trim: true,
    },
    votes: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastVoteAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'votetallies',
  }
);

// One tally document per option per poll
voteTallySchema.index({ pollId: 1, optionId: 1 }, { unique: true });

const VoteTally = mongoose.model('VoteTally', voteTallySchema);

module.exports = VoteTally;
