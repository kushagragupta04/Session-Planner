const db = require('../db');

const discoverSessions = async (req, res) => {
  const { track_id, level, speaker_id } = req.query;
  try {
    let query = `
      SELECT s.*, t.name as track_name,
             ARRAY_AGG(sp.name) FILTER (WHERE sp.name IS NOT NULL) as speaker_names,
             JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('id', sp.id, 'name', sp.name, 'bio', sp.bio, 'expertise', sp.expertise)) FILTER (WHERE sp.id IS NOT NULL) as speakers,
             (SELECT count(*) FROM registrations r WHERE r.session_id = s.id AND r.status = 'CONFIRMED')::int as current_attendance,
             rm.name as room_name, rm.capacity,
             v.name as venue_name, v.address as venue_address
      FROM sessions s
      LEFT JOIN tracks t ON s.track_id = t.id
      LEFT JOIN session_speakers ss ON s.id = ss.session_id
      LEFT JOIN speakers sp ON ss.speaker_id = sp.id
      LEFT JOIN session_schedule sch ON s.id = sch.session_id
      LEFT JOIN rooms rm ON sch.room_id = rm.id
      LEFT JOIN venues v ON rm.venue_id = v.id
      WHERE (s.status = 'SCHEDULED' OR s.status = 'APPROVED')
    `;
    const params = [];

    if (track_id) { params.push(track_id); query += ` AND s.track_id = $${params.length}`; }
    if (level)    { params.push(level);    query += ` AND s.level = $${params.length}`; }
    if (speaker_id) { params.push(speaker_id); query += ` AND sp.id = $${params.length}`; }

    query += ` GROUP BY s.id, t.name, rm.name, rm.capacity, v.name, v.address`;

    const sessions = await db.query(query, params);
    res.json(sessions.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error discovering sessions' });
  }
};

const toggleBookmark = async (req, res) => {
  const { session_id } = req.body;
  try {
    const existing = await db.query(
      'SELECT 1 FROM bookmarks WHERE user_id = $1 AND session_id = $2',
      [req.user.id, session_id]
    );

    if (existing.rows.length > 0) {
      await db.query('DELETE FROM bookmarks WHERE user_id = $1 AND session_id = $2', [req.user.id, session_id]);
      return res.json({ bookmarked: false });
    } else {
      await db.query('INSERT INTO bookmarks (user_id, session_id) VALUES ($1, $2)', [req.user.id, session_id]);
      return res.json({ bookmarked: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error toggling bookmark' });
  }
};

const registerForSession = async (req, res) => {
  const { session_id } = req.body;
  try {
    // 1. Double registration check
    const existing = await db.query(
      'SELECT 1 FROM registrations WHERE user_id = $1 AND session_id = $2',
      [req.user.id, session_id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Already registered for this session' });
    }

    // 2. Capacity Check
    const sessionInfo = await db.query(`
      SELECT r.capacity, (SELECT count(*) FROM registrations reg WHERE reg.session_id = $1 AND reg.status = 'CONFIRMED') as current_count
      FROM session_schedule ss
      JOIN rooms r ON ss.room_id = r.id
      WHERE ss.session_id = $1
    `, [session_id]);

    let status = 'CONFIRMED';
    if (sessionInfo.rows.length > 0) {
      const { capacity, current_count } = sessionInfo.rows[0];
      if (current_count >= capacity) {
        status = 'WAITLISTED';
      }
    }

    const registration = await db.query(
      'INSERT INTO registrations (user_id, session_id, status) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, session_id, status]
    );

    res.status(201).json(registration.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error registering for session' });
  }
};

const getMySchedule = async (req, res) => {
  try {
    const schedule = await db.query(`
      SELECT r.*, s.title, s.description, s.duration, s.level, sch.start_time, sch.end_time, rm.name as room_name
      FROM registrations r
      JOIN sessions s ON r.session_id = s.id
      LEFT JOIN session_schedule sch ON s.id = sch.session_id
      LEFT JOIN rooms rm ON sch.room_id = rm.id
      WHERE r.user_id = $1
    `, [req.user.id]);
    res.json(schedule.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving schedule' });
  }
};

const getRecommendations = async (req, res) => {
  try {
    // Simple logic: Sessions in tracks the user has bookmarked or registered for
    const recommendations = await db.query(`
      SELECT s.*, t.name as track_name
      FROM sessions s
      JOIN tracks t ON s.track_id = t.id
      WHERE s.status = 'SCHEDULED'
      AND s.track_id IN (
        SELECT track_id FROM sessions WHERE id IN (
          SELECT session_id FROM bookmarks WHERE user_id = $1
          UNION
          SELECT session_id FROM registrations WHERE user_id = $1
        )
      )
      AND s.id NOT IN (SELECT session_id FROM registrations WHERE user_id = $1)
      LIMIT 5
    `, [req.user.id]);
    res.json(recommendations.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error getting recommendations' });
  }
};

const submitRating = async (req, res) => {
  const { session_id, rating, comment } = req.body;
  try {
    const newRating = await db.query(
      'INSERT INTO session_ratings (user_id, session_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, session_id, rating, comment]
    );
    res.status(201).json(newRating.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error submitting rating' });
  }
};

const getBookmarks = async (req, res) => {
    try {
        const bookmarks = await db.query(`
            SELECT s.*, t.name as track_name
            FROM sessions s
            JOIN bookmarks b ON s.id = b.session_id
            JOIN tracks t ON s.track_id = t.id
            WHERE b.user_id = $1
        `, [req.user.id]);
        res.json(bookmarks.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error retrieving bookmarks' });
    }
};

const unregisterFromSession = async (req, res) => {
  const { session_id } = req.body;
  try {
    await db.query(
      'DELETE FROM registrations WHERE user_id = $1 AND session_id = $2',
      [req.user.id, session_id]
    );
    res.json({ message: 'Successfully unregistered' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error unregistering' });
  }
};

module.exports = {
  discoverSessions,
  toggleBookmark,
  registerForSession,
  getMySchedule,
  getRecommendations,
  submitRating,
  getBookmarks,
  unregisterFromSession
};
