const express = require('express');
const router = express.Router();
const { assignSession, getSchedules, confirmSchedule, removeSchedule } = require('../controllers/scheduleController');
const { auth, authorize } = require('../middleware/auth');

router.post('/', auth, authorize('ADMIN'), assignSession);
router.get('/', auth, getSchedules);
router.patch('/:session_id/confirm', auth, authorize('ADMIN'), confirmSchedule);
router.delete('/:session_id', auth, authorize('ADMIN'), removeSchedule);

module.exports = router;
