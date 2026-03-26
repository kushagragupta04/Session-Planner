const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const conferenceRoutes = require('./routes/conferenceRoutes');
const trackRoutes = require('./routes/trackRoutes');
const venueRoutes = require('./routes/venueRoutes');
const roomRoutes = require('./routes/roomRoutes');
const speakerRoutes = require('./routes/speakerRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const speakerPortalRoutes = require('./routes/speakerPortalRoutes');
const attendeePortalRoutes = require('./routes/attendeePortalRoutes');
const initDb = require('./db/init');

const app = express();
const PORT = process.env.PORT || 8000;

// Initialize Database
initDb();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/conferences', conferenceRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/speakers', speakerRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/speaker-portal', speakerPortalRoutes);
app.use('/api/attendee-portal', attendeePortalRoutes);

// Basic Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Session Planner API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
