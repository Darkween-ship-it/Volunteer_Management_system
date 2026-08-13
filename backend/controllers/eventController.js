const { readData, writeData } = require('../utils/storage');
const { nextId } = require('../utils/idGenerator');

const FILE = 'events';

function getAllEvents(req, res) {
  const events = readData(FILE);
  res.json({ success: true, data: events });
}

function getEventById(req, res) {
  const events = readData(FILE);
  const event = events.find((e) => e.id === Number(req.params.id));
  if (!event) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }
  res.json({ success: true, data: event });
}

function createEvent(req, res) {
  const { title, date, location, description } = req.body;
  if (!title || !date) {                                    // ← required fields are title+date, not name+email
    return res.status(400).json({ success: false, error: 'Title and date are required' });
  }
  const events = readData(FILE);
  const newEvent = {
    id: nextId(events),
    title,
    date,
    location: location || 'TBD',                           // ← default values
    description: description || '',
    image: req.file ? '/uploads/' + req.file.filename : null,
    participants: [],                                      // ← events hold a list of volunteers
    createdAt: new Date().toISOString(),
  };
  events.push(newEvent);
  writeData(FILE, events);
  res.status(201).json({ success: true, data: newEvent });
}

function updateEvent(req, res) {
  const events = readData(FILE);
  const index = events.findIndex((e) => e.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }
  events[index] = {
    ...events[index],
    ...req.body,
    ...(req.file ? { image: '/uploads/' + req.file.filename } : {}),
  };
  writeData(FILE, events);
  res.json({ success: true, data: events[index] });
}

function deleteEvent(req, res) {
  const events = readData(FILE);
  const filtered = events.filter((e) => e.id !== Number(req.params.id));
  if (filtered.length === events.length) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }
  writeData(FILE, filtered);
  res.json({ success: true, data: null });
}

function registerVolunteer(req, res) {
  const { volunteerId } = req.body;
  if (!volunteerId) {
    return res.status(400).json({ success: false, error: 'volunteerId is required' });
  }
  const events = readData(FILE);
  const event = events.find((e) => e.id === Number(req.params.id));
  if (!event) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }
  event.participants = event.participants || [];
  if (event.participants.some((p) => p.volunteerId === Number(volunteerId))) {
    return res.status(400).json({ success: false, error: 'Volunteer already registered for this event' });
  }
  event.participants.push({
    volunteerId: Number(volunteerId),
    registeredAt: new Date().toISOString(),
  });
  writeData(FILE, events);
  res.status(201).json({ success: true, data: event });
}

function getEventParticipants(req, res) {
  const events = readData(FILE);
  const event = events.find((e) => e.id === Number(req.params.id));
  if (!event) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }
  const volunteers = readData('volunteers');
  const participants = (event.participants || []).map((p) => {
    const volunteer = volunteers.find((v) => v.id === p.volunteerId);
    return {
      ...p,
      name: volunteer ? volunteer.name : 'Unknown',
      email: volunteer ? volunteer.email : '',
    };
  });
  res.json({ success: true, data: participants });
}

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerVolunteer,
  getEventParticipants,
};