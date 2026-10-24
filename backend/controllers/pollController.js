const POLL_CONFIG = require('../config/pollConfig');
const { getSortedOptions, getAggregateResults } = require('../services/resultsService');

/**
 * GET /api/poll
 * Returns poll metadata and locale-sorted available options
 */
async function getPollInfo(req, res) {
  try {
    const sortedOptions = getSortedOptions();

    res.json({
      success: true,
      pollId: POLL_CONFIG.pollId,
      wardName: POLL_CONFIG.wardName,
      pollTitle: POLL_CONFIG.pollTitle,
      headerBanner: POLL_CONFIG.headerBanner,
      subtitle: POLL_CONFIG.subtitle,
      disclaimer: POLL_CONFIG.disclaimer,
      options: sortedOptions,
    });
  } catch (err) {
    console.error('Error fetching poll info:', err);
    res.status(500).json({
      success: false,
      message: 'पोल विवरण लोड करने में त्रुटि हुई।',
    });
  }
}

/**
 * GET /api/results
 * Returns real-time aggregate vote counts and percentages for all options
 */
async function getResults(req, res) {
  try {
    const results = await getAggregateResults(POLL_CONFIG.pollId);
    res.json({
      success: true,
      ...results,
    });
  } catch (err) {
    console.error('Error calculating results:', err);
    res.status(500).json({
      success: false,
      message: 'परिणाम प्राप्त करने में त्रुटि हुई।',
    });
  }
}

module.exports = {
  getPollInfo,
  getResults,
};
