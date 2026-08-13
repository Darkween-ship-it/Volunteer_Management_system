const express = require('express');
const router = express.Router();
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
router.post('/', createVolunteer);
router.put('/:id', updateVolunteer);
router.delete('/:id', deleteVolunteer);

module.exports = router;
