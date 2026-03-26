const db = require('../db');

const assignSession = async (req, res) => {
  const { session_id, room_id, start_time, end_time } = req.body;
  try {
    // 1. Check for ROOM conflict (Strict - cannot overlap in same room)
    const roomConflict = await db.query(
      'SELECT sch.*, s.title FROM session_schedule sch JOIN sessions s ON sch.session_id = s.id WHERE sch.room_id = $1 AND (($2, $3) OVERLAPS (sch.start_time, sch.end_time)) AND sch.session_id != $4',
      [room_id, start_time, end_time, session_id]
    );
    
    if (roomConflict.rows.length > 0) {
      return res.status(409).json({ 
        message: 'Room is already occupied by another session at this time.', 
        conflict: roomConflict.rows[0] 
      });
    }

    // 2. Check for SPEAKER conflict (Warning - allowed but marks status)
    const speakerConflict = await db.query(`
      SELECT sp.name as speaker_name, s.title, sch.start_time, sch.end_time
      FROM session_speakers ss
      JOIN speakers sp ON ss.speaker_id = sp.id
      JOIN session_speakers ss2 ON ss.speaker_id = ss2.speaker_id
      JOIN sessions s ON ss2.session_id = s.id
      JOIN session_schedule sch ON s.id = sch.session_id
      WHERE ss.session_id = $1 
      AND ss2.session_id != $1
      AND (($2, $3) OVERLAPS (sch.start_time, sch.end_time))
    `, [session_id, start_time, end_time]);

    const hasSpeakerConflict = speakerConflict.rows.length > 0;
    const newStatus = hasSpeakerConflict ? 'PENDING_CONFLICT' : 'APPROVED';

    // 3. Upsert into session_schedule
    await db.query(`
      INSERT INTO session_schedule (session_id, room_id, start_time, end_time)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (session_id) DO UPDATE 
      SET room_id = EXCLUDED.room_id, start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time
    `, [session_id, room_id, start_time, end_time]);

    // 4. Update session status
    await db.query('UPDATE sessions SET status = $1 WHERE id = $2', [newStatus, session_id]);

    res.json({ 
      message: hasSpeakerConflict ? 'Session scheduled with conflicts' : 'Session scheduled successfully',
      status: newStatus,
      conflicts: speakerConflict.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error assigning session' });
  }
};

const confirmSchedule = async (req, res) => {
  const { session_id } = req.params;
  try {
    await db.query("UPDATE sessions SET status = 'SCHEDULED' WHERE id = $1", [session_id]);
    res.json({ message: 'Session schedule confirmed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error confirming schedule' });
  }
};

const removeSchedule = async (req, res) => {
  const { session_id } = req.params;
  try {
    await db.query('DELETE FROM session_schedule WHERE session_id = $1', [session_id]);
    await db.query("UPDATE sessions SET status = 'APPROVED' WHERE id = $1", [session_id]);
    res.json({ message: 'Session removed from schedule' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error removing schedule' });
  }
};

const getSchedules = async (req, res) => {
  try {
    const schedules = await db.query(`
      SELECT sch.*, s.title, s.status, r.name as room_name, t.name as track_name,
             json_agg(json_build_object('id', sp.id, 'name', sp.name)) as speakers
      FROM session_schedule sch
      JOIN sessions s ON sch.session_id = s.id
      JOIN rooms r ON sch.room_id = r.id
      JOIN tracks t ON s.track_id = t.id
      LEFT JOIN session_speakers sess_sp ON s.id = sess_sp.session_id
      LEFT JOIN speakers sp ON sess_sp.speaker_id = sp.id
      GROUP BY sch.id, s.title, s.status, r.name, t.name
    `);
    res.json(schedules.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving schedules' });
  }
};

module.exports = {
  assignSession,
  getSchedules,
  confirmSchedule,
  removeSchedule,
};
