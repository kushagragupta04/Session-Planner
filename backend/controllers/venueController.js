const db = require('../db');

const createVenue = async (req, res) => {
  const { name, address, floor_plan } = req.body;
  try {
    const newVenue = await db.query(
      'INSERT INTO venues (name, address, floor_plan) VALUES ($1, $2, $3) RETURNING *',
      [name, address, JSON.stringify(floor_plan || {})]
    );
    res.status(201).json(newVenue.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating venue' });
  }
};

const getVenues = async (req, res) => {
  try {
    const venues = await db.query('SELECT * FROM venues');
    res.json(venues.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving venues' });
  }
};

const deleteVenue = async (req, res) => {
  const { id } = req.params;
  try {
    // Rooms will be deleted if ON DELETE CASCADE is set, 
    // but let's be explicit if not sure about schema state
    await db.query('DELETE FROM rooms WHERE venue_id = $1', [id]);
    await db.query('DELETE FROM venues WHERE id = $1', [id]);
    res.json({ message: 'Venue and its rooms deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting venue' });
  }
};

module.exports = {
  createVenue,
  getVenues,
  deleteVenue,
};
