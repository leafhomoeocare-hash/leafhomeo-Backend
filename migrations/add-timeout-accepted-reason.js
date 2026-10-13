const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

module.exports = {
  up: async () => {
    try {
      // Add new enum value to cancellationReason
      await sequelize.query(`
        ALTER TYPE "enum_appointments_cancellationReason" ADD VALUE 'timeout_accepted' IF NOT EXISTS;
      `);
      console.log("✅ Added 'timeout_accepted' to cancellationReason enum");
    } catch (error) {
      console.error("❌ Error adding enum value:", error);
      throw error;
    }
  },

  down: async () => {
    // Note: PostgreSQL doesn't support removing enum values directly
    // This would require recreating the type, which is complex
    console.log("⚠️  Enum value removal not supported (requires type recreation)");
  }
};
