const db = require('../db');

const createConference = async (req, res) => {
  const { name, start_date, end_date, timezone } = req.body;

  try {
    const newConference = await db.query(
      'INSERT INTO conferences (name, start_date, end_date, timezone) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, start_date, end_date, timezone]
    );
    res.status(201).json(newConference.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating conference' });
  }
};

const getConferences = async (req, res) => {
  try {
    const conferences = await db.query('SELECT id, name, start_date::text, end_date::text, timezone FROM conferences ORDER BY start_date DESC');
    res.json(conferences.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving conferences' });
  }
};

const getConferenceById = async (req, res) => {
  const { id } = req.params;
  try {
    const conference = await db.query('SELECT id, name, start_date::text, end_date::text, timezone FROM conferences WHERE id = $1', [id]);
    if (conference.rows.length === 0) {
      return res.status(404).json({ message: 'Conference not found' });
    }
    res.json(conference.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving conference' });
  }
};

module.exports = {
  createConference,
  getConferences,
  getConferenceById,
};
