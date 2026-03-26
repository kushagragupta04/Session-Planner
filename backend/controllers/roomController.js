const db = require('../db');

const createRoom = async (req, res) => {
  const { venue_id, name, capacity, resources } = req.body;
  try {
    const newRoom = await db.query(
      'INSERT INTO rooms (venue_id, name, capacity, resources) VALUES ($1, $2, $3, $4) RETURNING *',
      [venue_id, name, capacity, resources]
    );
    res.status(201).json(newRoom.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating room' });
  }
};

const getRoomsByVenue = async (req, res) => {
  const { venueId } = req.params;
  try {
    const rooms = await db.query('SELECT * FROM rooms WHERE venue_id = $1', [venueId]);
    res.json(rooms.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving rooms' });
  }
};

const deleteRoom = async (req, res) => {
  const { id } = req.params;
  try {
    // Clear schedule entries for this room first
    await db.query('DELETE FROM session_schedule WHERE room_id = $1', [id]);
    await db.query('DELETE FROM rooms WHERE id = $1', [id]);
    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting room' });
  }
};

module.exports = {
  createRoom,
  getRoomsByVenue,
  deleteRoom,
};
