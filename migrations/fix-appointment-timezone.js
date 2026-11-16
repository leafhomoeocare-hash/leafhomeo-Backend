const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: true,
  }
);

async function fixAppointmentTimezone() {
  try {
    console.log('Starting appointment timezone fix...');
    console.log('This will change appointmentDateTime column to store IST without timezone conversion');

    // Check current column type
    const [results] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'appointments' 
      AND column_name = 'appointmentDateTime'
    `);

    console.log('Current column type:', results[0]);

    // Change column type to TIMESTAMP WITHOUT TIME ZONE
    await sequelize.query(`
      ALTER TABLE appointments 
      ALTER COLUMN "appointmentDateTime" TYPE TIMESTAMP WITHOUT TIME ZONE
    `);

    console.log('✅ appointmentDateTime column changed to TIMESTAMP WITHOUT TIME ZONE');
    console.log('Now it will store IST values as-is without timezone conversion');

    // Verify the change
    const [verifyResults] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'appointments' 
      AND column_name = 'appointmentDateTime'
    `);

    console.log('Updated column type:', verifyResults[0]);

    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

fixAppointmentTimezone();
