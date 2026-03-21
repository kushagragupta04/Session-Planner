const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
  getMyProfile,
  updateMyProfile,
  submitProposal,
  getMySessions,
  uploadMaterials,
  getMyFeedback,
  getAvailableSlots,
  deleteSession
} = require('../controllers/speakerPortalController');

router.get('/profile', auth, authorize('SPEAKER'), getMyProfile);
router.put('/profile', auth, authorize('SPEAKER'), updateMyProfile);
router.get('/available-slots', auth, authorize('SPEAKER'), getAvailableSlots);
router.post('/proposals', auth, authorize('SPEAKER'), submitProposal);
router.get('/sessions', auth, authorize('SPEAKER'), getMySessions);
router.delete('/sessions/:id', auth, authorize('SPEAKER'), deleteSession);
router.post('/materials', auth, authorize('SPEAKER'), uploadMaterials);
router.get('/feedback', auth, authorize('SPEAKER'), getMyFeedback);

module.exports = router;
