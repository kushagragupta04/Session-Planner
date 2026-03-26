const express = require('express');
const router = express.Router();
const { createRoom, getRoomsByVenue, deleteRoom } = require('../controllers/roomController');
const { auth, authorize } = require('../middleware/auth');

router.post('/', auth, authorize('ADMIN'), createRoom);
router.get('/venue/:venueId', auth, getRoomsByVenue);
router.delete('/:id', auth, authorize('ADMIN'), deleteRoom);

module.exports = router;
