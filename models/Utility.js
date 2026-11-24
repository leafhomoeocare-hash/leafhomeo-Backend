const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Utility = sequelize.define(
  "Utility",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    anydoctorFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "utility",
    timestamps: true,
  }
);

module.exports = Utility;
