const express = require('express');
const router = express.Router();
const { getPollInfo, getResults } = require('../controllers/pollController');

router.get('/', getPollInfo);
router.get('/results', getResults);

module.exports = router;
