const Vote = require('../models/Vote');
const VoteTally = require('../models/VoteTally');
const POLL_OPTIONS = require('../config/pollOptions');
const POLL_CONFIG = require('../config/pollConfig');

/**
 * Returns alphabetically sorted options according to Hindi/locale rules
 */
function getSortedOptions() {
  const collator = new Intl.Collator(POLL_CONFIG.locale || 'hi', {
    sensitivity: 'base',
    numeric: true,
  });

  return [...POLL_OPTIONS].sort((a, b) => collator.compare(a.name, b.name));
}

/**
 * Ensures all poll options exist as documents in the VoteTally collection.
 * This populates Atlas collection with each candidate so their vote counter (number) is visible.
 */
async function ensureTalliesExist(pollId = POLL_CONFIG.pollId) {
  for (const opt of POLL_OPTIONS) {
    const existingVoteCount = await Vote.countDocuments({ pollId, optionId: opt.id });
    await VoteTally.updateOne(
      { pollId, optionId: opt.id },
      {
        $setOnInsert: {
          pollId,
          optionId: opt.id,
          optionName: opt.name,
          votes: existingVoteCount,
          lastVoteAt: new Date(),
        },
      },
      { upsert: true }
    );
  }
}

/**
 * Calculates live aggregate results directly from VoteTally documents
 * where each candidate has a running number (existing votes + new votes).
 */
async function getAggregateResults(pollId = POLL_CONFIG.pollId) {
  await ensureTalliesExist(pollId);

  const tallies = await VoteTally.find({ pollId });
  const countMap = new Map();
  let totalVotes = 0;

  for (const item of tallies) {
    countMap.set(item.optionId, item.votes);
    totalVotes += item.votes;
  }

  const sorted = getSortedOptions();

  let leadingCandidate = null;
  let highestVotes = 0;

  const optionsWithResults = sorted.map((opt) => {
    const votes = countMap.get(opt.id) || 0;
    const percentageNumber = totalVotes > 0 ? Number(((votes / totalVotes) * 100).toFixed(2)) : 0;
    const percentage = `${percentageNumber.toFixed(2)}%`;

    if (votes > highestVotes) {
      highestVotes = votes;
      leadingCandidate = {
        id: opt.id,
        name: opt.name,
        votes,
        percentage,
      };
    }

    return {
      id: opt.id,
      name: opt.name,
      votes,
      percentage,
      percentageNumber,
    };
  });

  return {
    pollId,
    totalVotes,
    leadingCandidate: totalVotes > 0 ? leadingCandidate : null,
    results: optionsWithResults,
    updatedAt: new Date().toISOString(),
  };
}

module.exports = {
  getSortedOptions,
  getAggregateResults,
  ensureTalliesExist,
};
