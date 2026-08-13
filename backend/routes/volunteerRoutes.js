const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  getAllVolunteers,
  getVolunteerById,
  createVolunteer,
  updateVolunteer,
  deleteVolunteer,
  login,
} = require('../controllers/volunteerController');

router.post('/login', login);
router.get('/', getAllVolunteers);
router.get('/:id', getVolunteerById);
router.post('/', upload.single('profilePicture'), createVolunteer);
router.put('/:id', upload.single('profilePicture'), updateVolunteer);
router.delete('/:id', deleteVolunteer);

module.exports = router;
