const db = require('../db');

const getAvailableSlots = async (req, res) => {
  try {
    // 1. Get total rooms count
    const roomsRes = await db.query('SELECT id FROM rooms');
    const totalRooms = roomsRes.rows.length;

    // 2. Get conference dates as text to avoid timezone shifts
    const confRes = await db.query('SELECT start_date::text, end_date::text FROM conferences LIMIT 1');
    if (confRes.rows.length === 0) {
      return res.json({ slots: [], message: 'No conference configured' });
    }
    const { start_date, end_date } = confRes.rows[0];

    // 3. Get all scheduled sessions to calculate occupancy
    const scheduleRes = await db.query(`
      SELECT start_time, end_time, session_id 
      FROM session_schedule
    `);

    // 4. Get current user's (speaker's) own schedule to prevent double-booking
    const speakerScheduleRes = await db.query(`
      SELECT sch.start_time, sch.end_time
      FROM session_schedule sch
      JOIN session_speakers ss ON sch.session_id = ss.session_id
      JOIN speakers sp ON ss.speaker_id = sp.id
      WHERE sp.user_id = $1
    `, [req.user.id]);

    const speakerBookedSlots = speakerScheduleRes.rows.map(s => ({
      start: new Date(s.start_time).getTime(),
      end: new Date(s.end_time).getTime()
    }));

    // 5. Generate slots: 09:00 to 22:30 UTC
    const slots = [];
    // Parse start/end directly from strings
    const [sY, sM, sD] = start_date.split('-').map(Number);
    const [eY, eM, eD] = end_date.split('-').map(Number);

    let currentDate = new Date(Date.UTC(sY, sM - 1, sD));
    let lastDate = new Date(Date.UTC(eY, eM - 1, eD));

    // DEFENSIVE: If the conference range is too small (e.g. only 1 day), 
    // and the user expects more, we expand it in memory for the slot generation.
    const requestedUntil = new Date(Date.UTC(2026, 2, 20)); // March 20, 2026
    if (lastDate < requestedUntil) {
      lastDate = requestedUntil;
    }

    while (currentDate <= lastDate) {
      for (let hour = 9; hour < 23; hour++) {
        for (let min of [0, 30]) {
          // Use a fresh date each iteration and set UTC hours directly
          const slotStart = new Date(currentDate.getTime());
          slotStart.setUTCHours(hour, min, 0, 0);
          
          const slotStartTime = slotStart.getTime();
          
          // Check occupancy: how many sessions occupy this specific slot
          const occupancy = scheduleRes.rows.filter(s => {
            const start = new Date(s.start_time).getTime();
            const end = new Date(s.end_time).getTime();
            return slotStartTime >= start && slotStartTime < end;
          }).length;

          // Check if speaker is already busy
          const isSpeakerBusy = speakerBookedSlots.some(s => 
            slotStartTime >= s.start && slotStartTime < s.end
          );

          slots.push({
            time: slotStart.toISOString(),
            available: occupancy < totalRooms && !isSpeakerBusy,
            reason: isSpeakerBusy ? 'SPEAKER_BUSY' : (occupancy >= totalRooms ? 'FULL' : 'AVAILABLE')
          });
        }
      }
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    res.json(slots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error calculating availability' });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const speaker = await db.query(
      'SELECT * FROM speakers WHERE user_id = $1',
      [req.user.id]
    );
    if (speaker.rows.length === 0) {
      // Create an empty profile if it doesn't exist
      const newSpeaker = await db.query(
        'INSERT INTO speakers (name, user_id) SELECT name, id FROM users WHERE id = $1 RETURNING *',
        [req.user.id]
      );
      return res.json(newSpeaker.rows[0]);
    }
    res.json(speaker.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving profile' });
  }
};

const updateMyProfile = async (req, res) => {
  const { bio, expertise, availability } = req.body;
  try {
    const updatedSpeaker = await db.query(
      'UPDATE speakers SET bio = $1, expertise = $2, availability = $3 WHERE user_id = $4 RETURNING *',
      [bio, expertise, availability, req.user.id]
    );
    res.json(updatedSpeaker.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

const submitProposal = async (req, res) => {
  const { title, description, track_id, level, prerequisites, equipment_requirements, selected_slots } = req.body;
  
  if (!title || !description || !selected_slots || selected_slots.length === 0) {
    return res.status(400).json({ message: 'Title, description, and at least one time slot are required' });
  }

  try {
    // 1. Ensure the speaker record exists
    let speakerRes = await db.query('SELECT id FROM speakers WHERE user_id = $1', [req.user.id]);
    let speakerId;

    if (speakerRes.rows.length === 0) {
      const newSpeaker = await db.query(
        'INSERT INTO speakers (name, user_id) SELECT name, id FROM users WHERE id = $1 RETURNING id',
        [req.user.id]
      );
      speakerId = newSpeaker.rows[0].id;
    } else {
      speakerId = speakerRes.rows[0].id;
    }

    // 2. Sort slots and calculate duration
    // selected_slots are ISO strings
    const sortedSlots = [...selected_slots].sort();
    const startTimeDate = new Date(sortedSlots[0]);
    const lastSlotStart = new Date(sortedSlots[sortedSlots.length - 1]);
    const endTimeDate = new Date(lastSlotStart.getTime() + 30 * 60000); // end of last 30m slot
    
    const durationMinutes = (endTimeDate.getTime() - startTimeDate.getTime()) / 60000;
    const durationLabel = `${durationMinutes} minutes`;

    // 3. Find an available room that is free for ALL selected slots
    const roomsRes = await db.query('SELECT id FROM rooms');
    const allRooms = roomsRes.rows.map(r => r.id);
    
    // Check occupancy for each slot
    const occupancyMap = {};
    for (const slot of sortedSlots) {
      const occRes = await db.query(
        'SELECT room_id FROM session_schedule WHERE $1 >= start_time AND $1 < end_time',
        [slot]
      );
      occupancyMap[slot] = occRes.rows.map(r => r.room_id);
    }

    // Find a room ID that is NOT in the occupied list for ANY of the selected slots
    const availableRoomId = allRooms.find(roomId => 
      sortedSlots.every(slot => !occupancyMap[slot].includes(roomId))
    );

    if (!availableRoomId) {
      return res.status(409).json({ message: 'No single room is available for the entire duration of your selection. Please try a different combination.' });
    }

    // 4. Insert the session
    const trackIdToInsert = track_id && track_id !== '' ? track_id : null;
    const newSession = await db.query(
      'INSERT INTO sessions (title, description, track_id, level, duration, prerequisites, status, equipment_requirements) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [title, description, trackIdToInsert, level, durationLabel, prerequisites || [], 'PENDING', equipment_requirements]
    );

    const sessionId = newSession.rows[0].id;

    // 5. Link speaker
    await db.query(
      'INSERT INTO session_speakers (session_id, speaker_id, is_primary) VALUES ($1, $2, $3)',
      [sessionId, speakerId, true]
    );

    // 6. Create schedule entry (one entry covering the range)
    await db.query(
      'INSERT INTO session_schedule (session_id, room_id, start_time, end_time) VALUES ($1, $2, $3, $4)',
      [sessionId, availableRoomId, startTimeDate.toISOString(), endTimeDate.toISOString()]
    );

    console.log('Multi-slot Proposal created:', sessionId, 'Duration:', durationLabel);
    res.status(201).json(newSession.rows[0]);
  } catch (err) {
    console.error('Error in submitProposal:', err);
    res.status(500).json({ message: 'Failed to submit proposal: ' + err.message });
  }
};

const getMySessions = async (req, res) => {
  try {
    const sessions = await db.query(`
      SELECT s.*, t.name as track_name, 
             sch.start_time, sch.end_time, r.name as room_name
      FROM sessions s
      JOIN session_speakers ss ON s.id = ss.session_id
      JOIN speakers sp ON ss.speaker_id = sp.id
      LEFT JOIN tracks t ON s.track_id = t.id
      LEFT JOIN session_schedule sch ON s.id = sch.session_id
      LEFT JOIN rooms r ON sch.room_id = r.id
      WHERE sp.user_id = $1
      ORDER BY s.id DESC
    `, [req.user.id]);
    res.json(sessions.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving sessions' });
  }
};

const uploadMaterials = async (req, res) => {
  const { session_id, slides_url } = req.body;
  try {
    // Check ownership
    const ownership = await db.query(`
      SELECT 1 FROM session_speakers ss
      JOIN speakers sp ON ss.speaker_id = sp.id
      WHERE ss.session_id = $1 AND sp.user_id = $2
    `, [session_id, req.user.id]);

    if (ownership.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized for this session' });
    }

    const updatedSession = await db.query(
      'UPDATE sessions SET slides_url = $1 WHERE id = $2 RETURNING *',
      [slides_url, session_id]
    );
    res.json(updatedSession.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error uploading materials' });
  }
};

const getMyFeedback = async (req, res) => {
  try {
    const feedback = await db.query(`
      SELECT r.*, s.title as session_title
      FROM session_ratings r
      JOIN sessions s ON r.session_id = s.id
      JOIN session_speakers ss ON s.id = ss.session_id
      JOIN speakers sp ON ss.speaker_id = sp.id
      WHERE sp.user_id = $1
    `, [req.user.id]);
    res.json(feedback.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving feedback' });
  }
};

const deleteSession = async (req, res) => {
  const { id } = req.params;
  try {
    // Check ownership
    const ownership = await db.query(`
      SELECT 1 FROM session_speakers ss
      JOIN speakers sp ON ss.speaker_id = sp.id
      WHERE ss.session_id = $1 AND sp.user_id = $2
    `, [id, req.user.id]);

    if (ownership.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized to delete this session' });
    }

    // Delete (the DB should ideally have CASCADE on session_id for related tables)
    // To be safe, let's delete explicitly if constraints aren't set to cascade everything
    await db.query('DELETE FROM session_schedule WHERE session_id = $1', [id]);
    await db.query('DELETE FROM session_speakers WHERE session_id = $1', [id]);
    await db.query('DELETE FROM registrations WHERE session_id = $1', [id]);
    await db.query('DELETE FROM bookmarks WHERE session_id = $1', [id]);
    await db.query('DELETE FROM sessions WHERE id = $1', [id]);

    res.json({ message: 'Session deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting session' });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  submitProposal,
  getMySessions,
  uploadMaterials,
  getMyFeedback,
  getAvailableSlots,
  deleteSession
};
