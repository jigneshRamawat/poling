const mongoose = require('mongoose');

const namedVoterSchema = new mongoose.Schema(
  {
    pollId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    voterId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'नाम 100 वर्णों से अधिक नहीं हो सकता'],
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
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'namedvoters',
  }
);

namedVoterSchema.index({ pollId: 1, voterId: 1 }, { unique: true });

const NamedVoter = mongoose.model('NamedVoter', namedVoterSchema);

module.exports = NamedVoter;
