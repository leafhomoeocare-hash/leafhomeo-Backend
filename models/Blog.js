const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Blog = sequelize.define(
  "Blog",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    authorType: {
      type: DataTypes.ENUM("admin", "doctor"),
      allowNull: false,
    },

    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "User ID of the author (admin or doctor)",
    },

    blogType: {
      type: DataTypes.ENUM("patient", "doctor", "all"),
      allowNull: false,
      defaultValue: "all",
    },

    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "blogs",
    timestamps: true,
  }
);

module.exports = Blog;
