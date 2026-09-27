const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Consultation = sequelize.define(
  "Consultation",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    appointmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "appointments",
        key: "id",
      },
    },
    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "doctors",
        key: "id",
      },
    },
    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "patients",
        key: "id",
      },
    },
    chiefComplaints: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    appetite: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    thirst: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    desire: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    aversion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    habits: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    stool: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    urine: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    perspiration: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    menWomen: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sleep: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    dream: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    thermal: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    amelioration: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    aggravation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    otherComplaints: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    levelsOfHealth: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    perception: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    screenshots: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "JSON array of screenshot file paths",
    },
    callDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Duration in seconds",
    },
  },
  {
    tableName: "consultations",
    timestamps: true,
  }
);

module.exports = Consultation;
