const express = require('express');
const router = express.Router();
const { castVote, getVoteStatus, updateOptionalName } = require('../controllers/voteController');
const { voteLimiter } = require('../middleware/rateLimiter');
const {
  validateVotePayload,
  validateVoterIdQuery,
  validateNameUpdatePayload,
} = require('../middleware/validation');

// Cast vote
router.post('/', voteLimiter, validateVotePayload, castVote);

// Check vote status
router.get('/status', validateVoterIdQuery, getVoteStatus);

// Update optional voter name on existing vote
router.patch('/name', validateNameUpdatePayload, updateOptionalName);

module.exports = router;
