const { readData, writeData } = require('../utils/storage');
const { nextId } = require('../utils/idGenerator');

const FILE = 'participations';

function getAllRecords(req, res) {
  const records = readData(FILE);
  const events = readData('events');          // ← reads ANOTHER file
  const volunteers = readData('volunteers');  // ← reads ANOTHER file
  const enriched = records.map((r) => {
    const event = events.find((e) => e.id === r.eventId);
    const volunteer = volunteers.find((v) => v.id === r.volunteerId);
    return {
      ...r,
      eventTitle: event ? event.title : 'Unknown event',
      volunteerName: volunteer ? volunteer.name : 'Unknown',
    };
  });
  res.json({ success: true, data: enriched });
}

function createRecord(req, res) {
  const { eventId, volunteerId, status } = req.body;
  if (!eventId || !volunteerId || !status) {
    return res.status(400).json({ success: false, error: 'eventId, volunteerId and status are required' });
  }
  const records = readData(FILE);
  const newRecord = {
    id: nextId(records),
    eventId: Number(eventId),
    volunteerId: Number(volunteerId),
    status,
    date: new Date().toISOString(),
  };
  records.push(newRecord);
  writeData(FILE, records);
  res.status(201).json({ success: true, data: newRecord });
}

module.exports = { getAllRecords, createRecord };