const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const sequelize = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const Session = require('./src/models/Session');
const Room = require('./src/models/Room');
const TimeSlot = require('./src/models/TimeSlot');

sequelize.authenticate()
    .then(() => {
        console.log('Database connected...');
        return sequelize.sync();
    })
    .then(() => console.log('Models synced...'))
    .catch(err => console.log('Error: ' + err));

// Routes
app.get('/', (req, res) => {
    res.send('API is running...');
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
