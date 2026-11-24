// Run on server: node migrations/create-utility-table.js
// Creates `utility` table (holds anydoctorFee for Any Doctor bookings)
const sequelize = require("../config/database");
const Utility = require("../models/Utility");

(async () => {
  try {
    await Utility.sync(); // creates table if not exists
    console.log("✅ utility table ready");

    // Seed a default row if table is empty so client can update it manually
    const count = await Utility.count();
    if (count === 0) {
      await Utility.create({ anydoctorFee: 0 });
      console.log("✅ default utility row created (set anydoctorFee manually)");
    }

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
})();
