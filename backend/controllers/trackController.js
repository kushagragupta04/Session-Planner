const db = require('../db');

const createTrack = async (req, res) => {
  const { conference_id = null, name, description } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ message: 'Track name is required' });
  try {
    const newTrack = await db.query(
      'INSERT INTO tracks (conference_id, name, description) VALUES ($1, $2, $3) RETURNING *',
      [conference_id || null, name.trim(), description || '']
    );
    res.status(201).json(newTrack.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating track' });
  }
};

const getAllTracks = async (req, res) => {
  try {
    const tracksResult = await db.query('SELECT id, name, description, conference_id FROM tracks ORDER BY name');
    const tracks = tracksResult.rows;

    // Count sessions per track in a separate query
    let sessionCounts = {};
    try {
      const countsResult = await db.query(
        'SELECT track_id, COUNT(*)::int AS cnt FROM sessions WHERE track_id IS NOT NULL GROUP BY track_id'
      );
      countsResult.rows.forEach(r => { sessionCounts[r.track_id] = r.cnt; });
    } catch (_) {
      // sessions table may be empty or not exist — that's fine
    }

    const result = tracks.map(t => ({ ...t, session_count: sessionCounts[t.id] || 0 }));
    res.json(result);
  } catch (err) {
    console.error('getAllTracks error:', err.message, err.stack);
    res.status(500).json({ message: err.message });
  }
};

const getTracksByConference = async (req, res) => {
  const { conferenceId } = req.params;
  try {
    const tracks = await db.query(
      `SELECT t.*, (SELECT count(*) FROM sessions s WHERE s.track_id = t.id)::int as session_count
       FROM tracks t WHERE conference_id = $1 ORDER BY t.name`,
      [conferenceId]
    );
    res.json(tracks.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving tracks' });
  }
};

const updateTrack = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const updated = await db.query(
      'UPDATE tracks SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    if (updated.rows.length === 0) return res.status(404).json({ message: 'Track not found' });
    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating track' });
  }
};

const deleteTrack = async (req, res) => {
  const { id } = req.params;
  try {
    // Detach sessions from this track first to avoid FK violation
    await db.query('UPDATE sessions SET track_id = NULL WHERE track_id = $1', [id]);
    await db.query('DELETE FROM tracks WHERE id = $1', [id]);
    res.json({ message: 'Track deleted successfully' });
  } catch (err) {
    console.error('deleteTrack error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createTrack,
  getAllTracks,
  getTracksByConference,
  updateTrack,
  deleteTrack,
};
