const express = require('express');
const router = express.Router();
const attendeeController = require('../controllers/attendeePortalController');
const { auth, authorize } = require('../middleware/auth');

// All attendee routes require authentication and ATTENDEE role
router.use(auth);
router.use(authorize('ATTENDEE'));

router.get('/sessions', attendeeController.discoverSessions);
router.post('/bookmarks', attendeeController.toggleBookmark);
router.get('/bookmarks', attendeeController.getBookmarks);
router.post('/register', attendeeController.registerForSession);
router.get('/schedule', attendeeController.getMySchedule);
router.get('/recommendations', attendeeController.getRecommendations);
router.post('/ratings', attendeeController.submitRating);
router.delete('/register', attendeeController.unregisterFromSession);

module.exports = router;
