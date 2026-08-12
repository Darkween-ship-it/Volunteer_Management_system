const { readData, writeData } = require('../utils/storage');
const { nextId } = require('../utils/idGenerator');

const FILE = 'volunteers';

function getAllVolunteers(req, res) {
  const volunteers = readData(FILE);
  res.json({ success: true, data: volunteers });
}

function getVolunteerById(req, res) {
  const volunteers = readData(FILE);
  const volunteer = volunteers.find((v) => v.id === Number(req.params.id));
  if (!volunteer) {
    return res.status(404).json({ success: false, error: 'Volunteer not found' });
  }
  res.json({ success: true, data: volunteer });
}

function createVolunteer(req, res) {
  const { name, email, skills } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, error: 'Name and email are required' });
  }
  const volunteers = readData(FILE);
  const newVolunteer = {
    id: nextId(volunteers),
    name,
    email,
    skills: skills || [],
    createdAt: new Date().toISOString(),
  };
  volunteers.push(newVolunteer);
  writeData(FILE, volunteers);
  res.status(201).json({ success: true, data: newVolunteer });
}

function updateVolunteer(req, res) {
  const volunteers = readData(FILE);
  const index = volunteers.findIndex((v) => v.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Volunteer not found' });
  }
  volunteers[index] = { ...volunteers[index], ...req.body };
  writeData(FILE, volunteers);
  res.json({ success: true, data: volunteers[index] });
}

function deleteVolunteer(req, res) {
  const volunteers = readData(FILE);
  const filtered = volunteers.filter((v) => v.id !== Number(req.params.id));
  if (filtered.length === volunteers.length) {
    return res.status(404).json({ success: false, error: 'Volunteer not found' });
  }
  writeData(FILE, filtered);
  res.json({ success: true, data: null });
}

module.exports = {
  getAllVolunteers,
  getVolunteerById,
  createVolunteer,
  updateVolunteer,
  deleteVolunteer,
};
