const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AppointmentRejection = sequelize.define(
  "AppointmentRejection",
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
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "appointment_rejections",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['appointmentId', 'doctorId']
      }
    ]
  }
);

module.exports = AppointmentRejection;
