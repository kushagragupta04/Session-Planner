const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TimeSlot = sequelize.define('TimeSlot', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    startTime: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: false,
    },
});

module.exports = TimeSlot;
