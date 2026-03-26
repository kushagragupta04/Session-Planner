const express = require('express');
const router = express.Router();
const { createTrack, getAllTracks, getTracksByConference, updateTrack, deleteTrack } = require('../controllers/trackController');
const { auth, authorize } = require('../middleware/auth');

// Public: anyone can read tracks (needed for public session browsing and speaker forms)
router.get('/', getAllTracks);
router.get('/conference/:conferenceId', getTracksByConference);

// Admin-only mutations
router.post('/', auth, authorize('ADMIN'), createTrack);
router.put('/:id', auth, authorize('ADMIN'), updateTrack);
router.delete('/:id', auth, authorize('ADMIN'), deleteTrack);

module.exports = router;
