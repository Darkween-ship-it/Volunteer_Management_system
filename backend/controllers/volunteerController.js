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

function normalizeSkills(skills) {
  if (Array.isArray(skills)) return skills;
  if (typeof skills === 'string' && skills.trim()) return skills.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

function createVolunteer(req, res) {
  const { name, email, skills, password } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, error: 'Name and email are required' });
  }
  const volunteers = readData(FILE);
  const newVolunteer = {
    id: nextId(volunteers),
    name,
    email,
    password,
    skills: normalizeSkills(skills),
    profilePicture: req.file ? '/uploads/' + req.file.filename : null,
    createdAt: new Date().toISOString(),
    status: 'pending',
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
  volunteers[index] = {
    ...volunteers[index],
    ...req.body,
    ...(req.body.skills !== undefined ? { skills: normalizeSkills(req.body.skills) } : {}),
    ...(req.file ? { profilePicture: '/uploads/' + req.file.filename } : {}),
  };
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

function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  const volunteers = readData(FILE);
  const volunteer = volunteers.find(
    (v) => v.email === email && v.password === password
  );

  if (!volunteer) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  res.json({ success: true, data: volunteer });
}

module.exports = {
  getAllVolunteers,
  getVolunteerById,
  createVolunteer,
  updateVolunteer,
  deleteVolunteer,
  login,
};
