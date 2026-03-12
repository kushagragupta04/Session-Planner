const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Session = sequelize.define('Session', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
    },
    track: {
        type: DataTypes.STRING,
    },
    difficulty: {
        type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
        defaultValue: 'Beginner',
    },
    duration: {
        type: DataTypes.INTEGER,
        defaultValue: 30,
    },
});

module.exports = Session;
