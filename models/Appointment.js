const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Appointment = sequelize.define(
  "Appointment",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
        appointmentId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },


    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: true, // any_doctor case me null rahega
    },

    requestType: {
      type: DataTypes.ENUM(
        "any_doctor",
        "specific_doctor"
      ),
      allowNull: false,
    },

    appointmentDateTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(
        "pending",
        "accepted",
        "rejected",
        "payment_pending",
        "paid",
        "completed",
        "cancelled"
      ),
      defaultValue: "pending",
    },

    cancellationReason: {
      type: DataTypes.ENUM(
        "timeout_pending",
        "timeout_paid",
        "no_show_both",
        "doctor_no_show",
        "patient_no_show",
        "manual_doctor",
        "manual_patient"
      ),
      allowNull: true,
    },

    acceptedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    roomName:{
      type:DataTypes.STRING,
      allowNull:true 
    },

    shippingStatus: {
      type: DataTypes.ENUM(
        "draft",
        "prepared",
        "ready_to_transit",
        "in_transit"
      ),
      defaultValue: "draft",
    },

    trackerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    shiprocketOrderId: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    trackingUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    courierName: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    consultationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "consultations",
        key: "id",
      },
    },
    patientEndedCall: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    doctorEndedCall: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
},
  {
    tableName: "appointments",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['appointmentId']
      }
    ]
  }

);

module.exports = Appointment;