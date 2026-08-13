const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerVolunteer,
  getEventParticipants,
} = require('../controllers/eventController');

router.get('/:id/participants', getEventParticipants);
router.post('/:id/register', registerVolunteer);
router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.post('/', upload.single('image'), createEvent);
router.put('/:id', upload.single('image'), updateEvent);
router.delete('/:id', deleteEvent);

module.exports = router;