const Vote = require('../models/Vote');
const VoteTally = require('../models/VoteTally');
const NamedVoter = require('../models/NamedVoter');
const POLL_OPTIONS = require('../config/pollOptions');
const POLL_CONFIG = require('../config/pollConfig');
const { getAggregateResults } = require('../services/resultsService');

/**
 * POST /api/votes
 * Records a new vote:
 * 1. Checks voterId uniqueness (1 vote per browser/device)
 * 2. Saves vote audit record in Vote collection
 * 3. Atomically increments candidate's vote count ($inc: { votes: 1 })
 *    in VoteTally collection (number + existing number)
 * 4. Broadcasts live results with winning leader to all connected clients
 */
async function castVote(req, res) {
  try {
    const { pollId, optionId, voterId, optionalName } = req.body;

    // Check if voter has already voted in this poll
    const existingVote = await Vote.findOne({ pollId, voterId });
    if (existingVote) {
      return res.status(409).json({
        success: false,
        code: 'ALREADY_VOTED',
        message: 'आप इस ब्राउज़र से अपना वोट पहले ही दर्ज कर चुके हैं।',
      });
    }

    // Find candidate / option details
    const optionObj = POLL_OPTIONS.find((opt) => opt.id === optionId);
    const optionName = optionObj ? optionObj.name : 'दर्ज विकल्प';

    // 1. Record vote in Vote collection (for uniqueness and device verification)
    const newVote = await Vote.create({
      pollId,
      optionId,
      voterId,
      optionalName: (optionalName && typeof optionalName === 'string') ? optionalName.trim() : '',
    });

    // 2. Increment candidate vote count in VoteTally collection: (number + existing number)
    const updatedTally = await VoteTally.findOneAndUpdate(
      { pollId, optionId },
      {
        $inc: { votes: 1 },
        $set: {
          optionName,
          lastVoteAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    // 3. If user provided a name at voting time, store separate document in NamedVoter collection
    if (optionalName && optionalName.trim()) {
      await NamedVoter.findOneAndUpdate(
        { pollId, voterId },
        {
          $set: {
            name: optionalName.trim(),
            optionId,
            optionName,
            submittedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );
    }

    // 4. Compute fresh results & leading candidate
    const aggregate = await getAggregateResults(pollId);

    // 5. Broadcast live results to all clients via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('poll:resultsUpdated', aggregate);
    }

    return res.status(201).json({
      success: true,
      message: 'आपका वोट सफलतापूर्वक दर्ज हो गया है।',
      vote: {
        pollId: newVote.pollId,
        optionId: newVote.optionId,
        optionName,
        voterId: newVote.voterId,
        currentVotesForOption: updatedTally.votes,
        createdAt: newVote.createdAt,
      },
      results: aggregate,
    });
  } catch (err) {
    // Gracefully handle MongoDB duplicate key race condition (E11000)
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        code: 'ALREADY_VOTED',
        message: 'आप इस ब्राउज़र से अपना वोट पहले ही दर्ज कर चुके हैं।',
      });
    }

    console.error('Error casting vote:', err);
    return res.status(500).json({
      success: false,
      message: 'वोट सहेजने में तकनीकी समस्या आई। कृपया पुनः प्रयास करें।',
    });
  }
}

/**
 * GET /api/votes/status
 * Checks if the voterId has already voted in the active poll
 */
async function getVoteStatus(req, res) {
  try {
    const { voterId } = req.query;
    const pollId = POLL_CONFIG.pollId;

    const vote = await Vote.findOne({ pollId, voterId });

    if (!vote) {
      return res.json({
        success: true,
        hasVoted: false,
      });
    }

    const optionObj = POLL_OPTIONS.find((opt) => opt.id === vote.optionId);

    // Also check if a separate NamedVoter document exists for this user
    const namedRecord = await NamedVoter.findOne({ pollId, voterId });

    return res.json({
      success: true,
      hasVoted: true,
      vote: {
        optionId: vote.optionId,
        optionName: optionObj ? optionObj.name : 'दर्ज विकल्प',
        optionalName: namedRecord ? namedRecord.name : (vote.optionalName || ''),
        createdAt: vote.createdAt,
      },
    });
  } catch (err) {
    console.error('Error checking vote status:', err);
    return res.status(500).json({
      success: false,
      message: 'मतदान स्थिति जांचने में समस्या आई।',
    });
  }
}

/**
 * PATCH /api/votes/name
 * When user enters their name, stores in a separate document in the NamedVoter collection
 * containing: name, which option they selected, and timestamp.
 * Does NOT increase vote count or alter the selected option.
 */
async function updateOptionalName(req, res) {
  try {
    const { pollId, voterId } = req.body;
    const sanitizedName = req.sanitizedName;

    // Locate the voter's existing recorded vote
    const vote = await Vote.findOne({ pollId, voterId });

    if (!vote) {
      return res.status(404).json({
        success: false,
        message: 'वोट रिकॉर्ड नहीं मिला। नाम दर्ज करने से पहले वोट देना आवश्यक है।',
      });
    }

    // 1. Update optionalName in the Vote record
    vote.optionalName = sanitizedName;
    await vote.save();

    // 2. Store dedicated document in NamedVoter collection with name and chosen option
    const optionObj = POLL_OPTIONS.find((opt) => opt.id === vote.optionId);
    const optionName = optionObj ? optionObj.name : vote.optionId;

    const namedVoterDoc = await NamedVoter.findOneAndUpdate(
      { pollId, voterId },
      {
        $set: {
          name: sanitizedName,
          optionId: vote.optionId,
          optionName,
          submittedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: 'आपका नाम और चुना गया विकल्प सफलतापूर्वक सहेज लिया गया है।',
      namedVoter: {
        name: namedVoterDoc.name,
        optionId: namedVoterDoc.optionId,
        optionName: namedVoterDoc.optionName,
        submittedAt: namedVoterDoc.submittedAt,
      },
      optionalName: vote.optionalName,
    });
  } catch (err) {
    console.error('Error updating optional name:', err);
    return res.status(500).json({
      success: false,
      message: 'नाम सहेजने में त्रुटि हुई।',
    });
  }
}

module.exports = {
  castVote,
  getVoteStatus,
  updateOptionalName,
};
