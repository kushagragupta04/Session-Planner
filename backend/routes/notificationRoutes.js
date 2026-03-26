const express = require('express');
const router = express.Router();
const { sendAnnouncement, getAnnouncements } = require('../controllers/notificationController');
const { auth, authorize } = require('../middleware/auth');

router.post('/', auth, authorize('ADMIN'), sendAnnouncement);
router.get('/', auth, getAnnouncements);

module.exports = router;
