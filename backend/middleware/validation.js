const POLL_OPTIONS = require('../config/pollOptions');
const POLL_CONFIG = require('../config/pollConfig');

/**
 * Validates browser voter ID
 */
function isValidVoterId(voterId) {
  if (typeof voterId !== 'string') return false;
  const trimmed = voterId.trim();
  // Valid voter ID must be between 16 and 64 characters (e.g. UUIDv4 is 36 chars)
  const regex = /^[a-zA-Z0-9_-]{16,64}$/;
  return regex.test(trimmed);
}

/**
 * Middleware to validate voting payload: { pollId, optionId, voterId }
 */
function validateVotePayload(req, res, next) {
  const { pollId, optionId, voterId } = req.body;

  if (!pollId || typeof pollId !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'अमान्य पोल पहचान (pollId आवश्यक है)।',
    });
  }

  if (pollId !== POLL_CONFIG.pollId) {
    return res.status(400).json({
      success: false,
      message: 'यह पोल वर्तमान में सक्रिय नहीं है।',
    });
  }

  if (!isValidVoterId(voterId)) {
    return res.status(400).json({
      success: false,
      message: 'अमान्य वोटर पहचान (voterId अमान्य है)।',
    });
  }

  if (!optionId || typeof optionId !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'कृपया एक मान्य विकल्प चुनें।',
    });
  }

  const optionExists = POLL_OPTIONS.some((opt) => opt.id === optionId);
  if (!optionExists) {
    return res.status(400).json({
      success: false,
      message: 'चुना गया विकल्प अमान्य है या हटा दिया गया है।',
    });
  }

  next();
}

/**
 * Middleware to validate voter status check query: ?voterId=...
 */
function validateVoterIdQuery(req, res, next) {
  const { voterId } = req.query;

  if (!isValidVoterId(voterId)) {
    return res.status(400).json({
      success: false,
      message: 'अमान्य वोटर पहचान (voterId आवश्यक और मान्य होना चाहिए)।',
    });
  }

  next();
}

/**
 * Middleware to validate optional name update: { pollId, voterId, optionalName }
 */
function validateNameUpdatePayload(req, res, next) {
  const { pollId, voterId, optionalName } = req.body;

  if (!pollId || pollId !== POLL_CONFIG.pollId) {
    return res.status(400).json({
      success: false,
      message: 'अमान्य पोल पहचान।',
    });
  }

  if (!isValidVoterId(voterId)) {
    return res.status(400).json({
      success: false,
      message: 'अमान्य वोटर पहचान।',
    });
  }

  // Ensure request is NOT attempting to pass optionId or modify vote choice
  if (req.body.optionId !== undefined) {
    return res.status(400).json({
      success: false,
      message: 'वोट का विकल्प बदला नहीं जा सकता है।',
    });
  }

  if (typeof optionalName !== 'string' && optionalName !== undefined && optionalName !== null) {
    return res.status(400).json({
      success: false,
      message: 'नाम एक मान्य टेक्स्ट होना चाहिए।',
    });
  }

  // Length check: max 60 characters
  const trimmedName = (optionalName || '').trim();
  if (trimmedName.length > 60) {
    return res.status(400).json({
      success: false,
      message: 'नाम 60 अक्षरों से अधिक नहीं हो सकता।',
    });
  }

  req.sanitizedName = trimmedName;
  next();
}

module.exports = {
  validateVotePayload,
  validateVoterIdQuery,
  validateNameUpdatePayload,
};
