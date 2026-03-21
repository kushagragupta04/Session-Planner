const express = require('express');
const router = express.Router();
const { createSpeaker, getSpeakers } = require('../controllers/speakerController');
const { auth, authorize } = require('../middleware/auth');

router.post('/', auth, authorize('ADMIN'), createSpeaker);
router.get('/', auth, getSpeakers);

module.exports = router;
