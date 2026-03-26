const db = require('../db');

const sendAnnouncement = async (req, res) => {
  const { title, message, target_role } = req.body;
  try {
    const newAnnouncement = await db.query(
      'INSERT INTO announcements (title, message, target_role) VALUES ($1, $2, $3) RETURNING *',
      [title, message, target_role || 'ALL']
    );
    res.status(201).json(newAnnouncement.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error sending announcement' });
  }
};

const getAnnouncements = async (req, res) => {
  try {
    const announcements = await db.query('SELECT * FROM announcements ORDER BY created_at DESC');
    res.json(announcements.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving announcements' });
  }
};

module.exports = {
  sendAnnouncement,
  getAnnouncements,
};
