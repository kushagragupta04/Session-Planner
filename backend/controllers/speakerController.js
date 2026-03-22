const db = require('../db');

const createSpeaker = async (req, res) => {
  const { name, bio, expertise, availability } = req.body;
  try {
    const newSpeaker = await db.query(
      'INSERT INTO speakers (name, bio, expertise, availability) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, bio, expertise, JSON.stringify(availability || {})]
    );
    res.status(201).json(newSpeaker.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating speaker' });
  }
};

const getSpeakers = async (req, res) => {
  try {
    const speakers = await db.query('SELECT * FROM speakers');
    res.json(speakers.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving speakers' });
  }
};

module.exports = {
  createSpeaker,
  getSpeakers,
};
