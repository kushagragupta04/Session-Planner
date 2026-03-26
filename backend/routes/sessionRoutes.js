const express = require('express');
const router = express.Router();
const { createSession, getSessions, updateSessionStatus } = require('../controllers/sessionController');
const { auth, authorize } = require('../middleware/auth');

router.post('/', auth, authorize('ADMIN'), createSession);
router.get('/', auth, getSessions);
router.patch('/:id/status', auth, authorize('ADMIN'), updateSessionStatus);

module.exports = router;
