const db = require('../db');

const createSession = async (req, res) => {
  const { track_id, title, description, level, duration, prerequisites, speaker_ids } = req.body;
  try {
    const newSession = await db.query(
      'INSERT INTO sessions (track_id, title, description, level, duration, prerequisites) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [track_id, title, description, level, duration, prerequisites]
    );
    
    const sessionId = newSession.rows[0].id;

    if (speaker_ids && speaker_ids.length > 0) {
      for (const speakerId of speaker_ids) {
        await db.query(
          'INSERT INTO session_speakers (session_id, speaker_id, is_primary) VALUES ($1, $2, $3)',
          [sessionId, speakerId, speakerId === speaker_ids[0]]
        );
      }
    }

    res.status(201).json(newSession.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating session' });
  }
};

const getSessions = async (req, res) => {
  try {
    const sessions = await db.query(`
      SELECT s.*, t.name as track_name,
      json_agg(json_build_object('id', sp.id, 'name', sp.name)) as speakers
      FROM sessions s
      LEFT JOIN tracks t ON s.track_id = t.id
      LEFT JOIN session_speakers ss ON s.id = ss.session_id
      LEFT JOIN speakers sp ON ss.speaker_id = sp.id
      GROUP BY s.id, t.name
    `);
    res.json(sessions.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving sessions' });
  }
};

const updateSessionStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updatedSession = await db.query(
      'UPDATE sessions SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (status === 'REJECTED') {
      await db.query('DELETE FROM session_schedule WHERE session_id = $1', [id]);
    }

    if (updatedSession.rows.length === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.json(updatedSession.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating session status' });
  }
};

module.exports = {
  createSession,
  getSessions,
  updateSessionStatus,
};
