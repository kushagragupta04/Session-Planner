const express = require('express');
const router = express.Router();
const { createConference, getConferences, getConferenceById } = require('../controllers/conferenceController');
const { auth, authorize } = require('../middleware/auth');

router.post('/', auth, authorize('ADMIN'), createConference);
router.get('/', auth, getConferences);
router.get('/:id', auth, getConferenceById);

module.exports = router;
