const express = require('express');
const router = express.Router();
const { createVenue, getVenues, deleteVenue } = require('../controllers/venueController');
const { auth, authorize } = require('../middleware/auth');

router.post('/', auth, authorize('ADMIN'), createVenue);
router.get('/', auth, getVenues);
router.delete('/:id', auth, authorize('ADMIN'), deleteVenue);

module.exports = router;
